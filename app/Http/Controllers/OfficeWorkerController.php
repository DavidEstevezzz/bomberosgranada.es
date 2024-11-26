<?php

namespace App\Http\Controllers;

use App\Models\OfficeWorker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class OfficeWorkerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $officeWorkers = OfficeWorker::with('user', 'park')->get();
        return response()->json($officeWorkers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('Request received for office worker creation', ['request_data' => $request->all()]);

        $rules = [
            'id_empleado' => 'required|exists:users,id_empleado',
            'id_parque' => 'required|exists:parks,id_parque',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            Log::error('Validation failed for office worker creation', ['errors' => $validator->errors()->toArray()]);
            return response()->json($validator->errors(), 400);
        }

        try {
            $data = $request->all();

            Log::info('Creating office worker with data', ['data' => $data]);

            $officeWorker = OfficeWorker::create($data);
            if ($officeWorker) {
                Log::info('Office worker created successfully', ['office_worker_id' => $officeWorker->id]);
                return response()->json($officeWorker, 201);
            } else {
                throw new \Exception('Office worker creation failed');
            }
        } catch (\Exception $e) {
            Log::error('Error creating office worker', ['message' => $e->getMessage(), 'stack' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $officeWorker = OfficeWorker::with('user', 'park')->find($id);

        if (!$officeWorker) {
            return response()->json(['message' => 'Office worker not found'], 404);
        }

        return response()->json($officeWorker);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        Log::info('Request received for office worker update', $request->all());

        $rules = [
            'id_parque' => 'required|exists:parks,id_parque',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            Log::error('Validation failed for office worker update', ['errors' => $validator->errors()->toArray()]);
            return response()->json($validator->errors(), 400);
        }

        try {
            $data = $request->all();

            $officeWorker = OfficeWorker::find($id);

            if (!$officeWorker) {
                return response()->json(['message' => 'Office worker not found'], 404);
            }

            Log::info('Updating office worker', ['office_worker_id' => $officeWorker->id, 'data' => $data]);
            $officeWorker->update($data);
            Log::info('Office worker updated successfully', $officeWorker->toArray());
            return response()->json($officeWorker, 200);
        } catch (\Exception $e) {
            Log::error('Error updating office worker', ['message' => $e->getMessage(), 'stack' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $officeWorker = OfficeWorker::find($id);

        if (!$officeWorker) {
            return response()->json(['message' => 'Office worker not found'], 404);
        }

        $officeWorker->delete();

        return response()->json(null, 204);
    }
}
