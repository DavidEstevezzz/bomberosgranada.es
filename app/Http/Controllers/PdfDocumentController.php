<?php

namespace App\Http\Controllers;

use App\Models\PdfDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PdfDocumentController extends Controller
{
    /**
     * Obtener el documento PDF más reciente.
     *
     * @return \Illuminate\Http\Response
     */
    public function getLatest()
    {
        $document = PdfDocument::latest()->first();
        
        if (!$document) {
            return response()->json(['message' => 'No hay documentos disponibles'], 404);
        }
        
        return response()->json($document);
    }

    /**
     * Subir un nuevo documento PDF.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function upload(Request $request)
    {
        Log::info('Inicio de la subida de documento PDF.');
        Log::info('Datos de la petición:', $request->all());

        $request->validate([
            'title' => 'required|string|max:255',
            //'pdf_file' => 'required|file|mimes:pdf|max:10240', // 10MB máximo
        ]);

        try {
            // Si existe un documento previo, lo eliminamos
            $existingDocuments = PdfDocument::all();
            Log::info('Número de documentos existentes encontrados: ' . count($existingDocuments));
            foreach ($existingDocuments as $doc) {
                Log::info('Eliminando documento existente: ' . $doc->original_filename . ' con ruta: ' . $doc->file_path);
                if (Storage::exists($doc->file_path)) {
                    Storage::delete($doc->file_path);
                    Log::info('Archivo eliminado correctamente: ' . $doc->file_path);
                } else {
                    Log::warning('Archivo no encontrado durante la eliminación: ' . $doc->file_path);
                }
                $doc->delete();
                Log::info('Registro de documento eliminado de la base de datos: ' . $doc->id);
            }

            $file = $request->file('pdf_file');
            Log::info('Información del archivo subido:');
            Log::info('Nombre original: ' . $file->getClientOriginalName());
            Log::info('Tamaño: ' . $file->getSize());
            Log::info('Tipo MIME: ' . $file->getMimeType());

            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();

            // Crear un nombre único para el archivo
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();

            // Guardar el archivo en el almacenamiento
            $path = $file->storeAs('pdfs', $filename, 'public');
            Log::info('Archivo guardado en la ruta: ' . $path);

            // Crear el registro en la base de datos
            $document = PdfDocument::create([
                'title' => $request->title,
                'filename' => $filename,
                'original_filename' => $originalName,
                'file_path' => $path,
                'file_size' => $fileSize,
                'uploaded_by' => Auth::id(),
            ]);
            Log::info('Registro de documento creado en la base de datos con ID: ' . $document->id);

            return response()->json([
                'message' => 'Documento PDF subido correctamente',
                'document' => $document
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Error de validación al subir el documento:', $e->errors());
            return response()->json([
                'message' => 'Error de validación al subir el documento',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error al subir el documento:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Error al subir el documento',
                'error' => $e->getMessage()
            ], 500);
        } finally {
            Log::info('Fin del proceso de subida de documento PDF.');
        }
    }


    /**
     * Mostrar un documento PDF específico.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $document = PdfDocument::findOrFail($id);
        
        // Comprobar si el archivo existe físicamente
        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'Archivo no encontrado'], 404);
        }
        
        return response()->file(storage_path('app/public/' . $document->file_path));
    }

    /**
     * Descargar un documento PDF.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function download($id)
    {
        $document = PdfDocument::findOrFail($id);
        
        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'Archivo no encontrado'], 404);
        }
        
        return response()->download(
            storage_path('app/public/' . $document->file_path),
            $document->original_filename
        );
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
        
        // Eliminar el archivo físico
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }
        
        // Eliminar el registro de la base de datos
        $document->delete();
        
        return response()->json(['message' => 'Documento eliminado correctamente']);
    }
}