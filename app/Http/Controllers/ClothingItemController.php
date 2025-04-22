<?php

namespace App\Http\Controllers;

use App\Models\ClothingItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClothingItemController extends Controller
{
    /**
     * Display a listing of the clothing items.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $clothingItems = ClothingItem::orderBy('name')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $clothingItems,
        ]);
    }

    /**
     * Store a newly created clothing item in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:clothing_items',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $clothingItem = ClothingItem::create([
            'name' => $request->name,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Clothing item created successfully',
            'data' => $clothingItem,
        ], 201);
    }

    /**
     * Display the specified clothing item.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $clothingItem = ClothingItem::find($id);
        
        if (!$clothingItem) {
            return response()->json([
                'status' => 'error',
                'message' => 'Clothing item not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $clothingItem,
        ]);
    }

    /**
     * Update the specified clothing item in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $clothingItem = ClothingItem::find($id);
        
        if (!$clothingItem) {
            return response()->json([
                'status' => 'error',
                'message' => 'Clothing item not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:clothing_items,name,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $clothingItem->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Clothing item updated successfully',
            'data' => $clothingItem,
        ]);
    }

    /**
     * Remove the specified clothing item from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $clothingItem = ClothingItem::find($id);
        
        if (!$clothingItem) {
            return response()->json([
                'status' => 'error',
                'message' => 'Clothing item not found',
            ], 404);
        }

        $clothingItem->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Clothing item deleted successfully',
        ]);
    }
}