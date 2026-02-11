<?php

namespace App\Http\Controllers;

use App\Models\PdfDocument;
use App\Models\PdfDocumentView;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\URL;


class PdfDocumentController extends Controller
{
    // Usar ruta relativa al proyecto - más portable
    private const STORAGE_BASE_PATH = '/var/www/bomberosgranada.es/shared/storage/';

    /**
     * Obtener el documento PDF más reciente.
     *
     * @return \Illuminate\Http\Response
     */
    public function getLatest()
    {
        $document = PdfDocument::latest()->first();

        if (!$document) {
            return response()->json([
                'message' => 'No hay documentos disponibles',
                'document' => null,
                'has_new' => false,
            ], 404);
        }

        $userId = Auth::id();
        $hasNew = false;

        if ($userId) {
            $hasNew = !PdfDocumentView::where('user_id', $userId)
                ->where('pdf_document_id', $document->id)
                ->exists();
        }

        return response()->json([
            'document' => $document,
            'has_new' => $hasNew,
        ]);
    }

    public function markAsViewed($id)
    {
        $userId = Auth::id();

        if (!$userId) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        $document = PdfDocument::find($id);

        if (!$document) {
            return response()->json(['message' => 'Documento no encontrado'], 404);
        }

        $view = PdfDocumentView::updateOrCreate(
            [
                'user_id' => $userId,
                'pdf_document_id' => $document->id,
            ],
            [
                'viewed_at' => Carbon::now(),
            ]
        );

        return response()->json([
            'message' => 'Documento marcado como visto',
            'is_new' => $view->wasRecentlyCreated,
        ]);
    }

    private function resolveFileInfo(PdfDocument $document, string $type = 'primary'): array
    {
        $normalizedType = $type === 'secondary' ? 'secondary' : 'primary';

        if ($normalizedType === 'secondary') {
            if (!$document->file_path_second) {
                abort(404, 'Documento secundario no disponible');
            }

            $relativePath = $document->file_path_second;
            $downloadName = $document->original_filename_second ?? basename($document->file_path_second);
        } else {
            if (!$document->file_path) {
                abort(404, 'Documento no disponible');
            }

            $relativePath = $document->file_path;
            $downloadName = $document->original_filename ?? basename($document->file_path);
        }

        $fullPath = self::STORAGE_BASE_PATH . $relativePath;

        if (!file_exists($fullPath)) {
            abort(404, 'Archivo no encontrado');
        }

        return [$fullPath, $downloadName];
    }

    public function generateEmbedUrl(Request $request, $id)
    {
        $document = PdfDocument::findOrFail($id);
        $requestedType = $request->query('type', 'primary');
        $normalizedType = $requestedType === 'secondary' ? 'secondary' : 'primary';

        if ($normalizedType === 'secondary' && !$document->file_path_second) {
            return response()->json(['message' => 'Documento secundario no disponible'], 404);
        }

        $expiresAt = Carbon::now()->addMinutes(10);

        $signedUrl = URL::temporarySignedRoute(
            'pdf-documents.stream',
            $expiresAt,
            [
                'id' => $document->id,
                'type' => $normalizedType,
            ]
        );

        return response()->json([
            'url' => $signedUrl,
            'expires_at' => $expiresAt->toIso8601String(),
            'type' => $normalizedType,
        ]);
    }

    public function stream(Request $request, $id)
    {
        $document = PdfDocument::findOrFail($id);
        [$fullPath, $downloadName] = $this->resolveFileInfo($document, $request->query('type', 'primary'));

        return response()->file($fullPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $downloadName . '"',
        ]);
    }

    /**
     * Subir nuevos documentos PDF.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function upload(Request $request)
    {
        Log::info('Inicio de la subida de documentos PDF.');
        Log::info('Datos de la petición (parámetros):', $request->all());
        Log::info('Archivos recibidos:', $request->files->all());

        // Validar la petición
        $request->validate([
            'title' => 'required|string|max:255',
            'pdf_file' => 'required|file|mimes:pdf|max:10240', // 10MB máximo
            'pdf_file_second' => 'nullable|file|mimes:pdf|max:10240', // 10MB máximo, opcional
        ]);

        try {
            // Verificar que se ha recibido el primer archivo
            if (!$request->hasFile('pdf_file')) {
                Log::error('No se encontró el archivo pdf_file en el request.');
                return response()->json(['message' => 'No se ha seleccionado ningún archivo PDF principal'], 400);
            }

            $file = $request->file('pdf_file');
            if (!$file) {
                Log::error('La variable $file es null después de obtener pdf_file.');
                return response()->json(['message' => 'Archivo PDF principal no recibido'], 400);
            }

            Log::info('Información del archivo principal subido:');
            Log::info('Nombre original: ' . $file->getClientOriginalName());
            Log::info('Tamaño: ' . $file->getSize());
            Log::info('Tipo MIME: ' . $file->getMimeType());

            // Verificar el segundo archivo (opcional)
            $file_second = null;
            $filename_second = null;
            $originalName_second = null;
            $fileSize_second = null;
            $path_second = null;

            if ($request->hasFile('pdf_file_second')) {
                $file_second = $request->file('pdf_file_second');
                Log::info('Información del archivo secundario subido:');
                Log::info('Nombre original: ' . $file_second->getClientOriginalName());
                Log::info('Tamaño: ' . $file_second->getSize());
                Log::info('Tipo MIME: ' . $file_second->getMimeType());
            }

            // Eliminar documentos previos (si existen)
            $existingDocuments = PdfDocument::all();
            Log::info('Número de documentos existentes encontrados: ' . count($existingDocuments));
            foreach ($existingDocuments as $doc) {
                Log::info('Eliminando documento existente: ' . $doc->original_filename . ' con ruta: ' . $doc->file_path);
                // Eliminar el primer archivo
                $absolutePath = self::STORAGE_BASE_PATH . $doc->file_path;
                if (file_exists($absolutePath)) {
                    unlink($absolutePath);
                    Log::info('Archivo eliminado correctamente: ' . $absolutePath);
                } else {
                    Log::warning('Archivo no encontrado durante la eliminación: ' . $absolutePath);
                }

                // Eliminar el segundo archivo si existe
                if ($doc->file_path_second) {
                    $absolutePath_second = self::STORAGE_BASE_PATH . $doc->file_path_second;
                    if (file_exists($absolutePath_second)) {
                        unlink($absolutePath_second);
                        Log::info('Archivo secundario eliminado correctamente: ' . $absolutePath_second);
                    } else {
                        Log::warning('Archivo secundario no encontrado durante la eliminación: ' . $absolutePath_second);
                    }
                }

                $doc->delete();
                Log::info('Registro de documento eliminado de la base de datos: ' . $doc->id);
            }

            // Procesar el primer archivo
            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();

            // Crear un nombre único para el primer archivo
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();

            // Definir la ruta destino absoluta
            $destinationDir = self::STORAGE_BASE_PATH . 'pdfs';
            if (!is_dir($destinationDir)) {
                mkdir($destinationDir, 0755, true);
            }

            // Mover el primer archivo a la carpeta de destino
            $file->move($destinationDir, $filename);
            // Guardar la ruta relativa en la base de datos
            $path = 'pdfs/' . $filename;
            Log::info('Archivo principal guardado en la ruta: ' . $destinationDir . '/' . $filename);

            // Procesar el segundo archivo si existe
            if ($file_second) {
                $originalName_second = $file_second->getClientOriginalName();
                $fileSize_second = $file_second->getSize();

                // Crear un nombre único para el segundo archivo
                $filename_second = Str::random(40) . '.' . $file_second->getClientOriginalExtension();

                // Mover el segundo archivo a la carpeta de destino
                $file_second->move($destinationDir, $filename_second);
                $path_second = 'pdfs/' . $filename_second;
                Log::info('Archivo secundario guardado en la ruta: ' . $destinationDir . '/' . $filename_second);
            }

            // Crear el registro en la base de datos
            $document = PdfDocument::create([
                'title' => $request->title,
                'filename' => $filename,
                'filename_second' => $filename_second,
                'original_filename' => $originalName,
                'original_filename_second' => $originalName_second,
                'file_path' => $path,
                'file_path_second' => $path_second,
                'file_size' => $fileSize,
                'file_size_second' => $fileSize_second,
                'uploaded_by' => Auth::id(),
            ]);
            Log::info('Registro de documento creado en la base de datos con ID: ' . $document->id);

            return response()->json([
                'message' => 'Documentos PDF subidos correctamente',
                'document' => $document
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Error de validación al subir los documentos:', $e->errors());
            return response()->json([
                'message' => 'Error de validación al subir los documentos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error al subir los documentos:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Error al subir los documentos',
                'error' => $e->getMessage()
            ], 500);
        } finally {
            Log::info('Fin del proceso de subida de documentos PDF.');
        }
    }

    /**
     * Mostrar un documento PDF específico.
     *
     * @param  int  $id
     * @param  string  $type
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        // Obtener el tipo desde los valores por defecto de la ruta
        $type = $request->route()->defaults['type'] ?? 'primary';

        Log::info('Mostrando documento', [
            'id' => $id,
            'type' => $type,
            'route_defaults' => $request->route()->defaults,
            'URI' => $request->getRequestUri()
        ]);

        $document = PdfDocument::findOrFail($id);
        [$fullPath] = $this->resolveFileInfo($document, $type);

        Log::info('Enviando archivo', ['size' => filesize($fullPath)]);
        return response()->file($fullPath);
    }

    /**
     * Descargar un documento PDF.
     *
     * @param  int  $id
     * @param  string  $type
     * @return \Illuminate\Http\Response
     */
    public function download($id, $type = 'primary')
    {
        $document = PdfDocument::findOrFail($id);

        [$fullPath, $downloadName] = $this->resolveFileInfo($document, $type);

        return response()->download($fullPath, $downloadName);
    }

    /**
     * Eliminar un documento PDF.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $document = PdfDocument::findOrFail($id);

        // Eliminar los archivos físicos
        $absolutePath = self::STORAGE_BASE_PATH . $document->file_path;
        if (file_exists($absolutePath)) {
            unlink($absolutePath);
        }

        if ($document->file_path_second) {
            $absolutePath_second = self::STORAGE_BASE_PATH . $document->file_path_second;
            if (file_exists($absolutePath_second)) {
                unlink($absolutePath_second);
            }
        }

        // Eliminar el registro de la base de datos
        $document->delete();

        return response()->json(['message' => 'Documentos eliminados correctamente']);
    }
}