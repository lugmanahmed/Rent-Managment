<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AssetController extends Controller
{
    /**
     * Display a listing of assets
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Asset::query();

            // Category filter
            if ($request->has('category') && $request->category) {
                $query->where('category', $request->category);
            }

            // Status filter
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('brand', 'like', "%{$search}%")
                      ->orWhere('serial_no', 'like', "%{$search}%");
                });
            }

            $assets = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'assets' => $assets
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch assets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created asset
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'brand' => 'nullable|string|max:50',
            'serial_no' => 'nullable|string|max:100',
            'category' => ['required', Rule::in(['furniture', 'appliance', 'electronics', 'plumbing', 'electrical', 'hvac', 'security', 'other'])],
            'status' => ['sometimes', Rule::in(['working', 'faulty', 'maintenance', 'retired'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $asset = Asset::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Asset created successfully',
                'asset' => $asset
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create asset',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified asset
     */
    public function show(Asset $asset): JsonResponse
    {
        try {
            $asset->load('rentalUnits');

            return response()->json([
                'success' => true,
                'asset' => $asset
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch asset',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified asset
     */
    public function update(Request $request, Asset $asset): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'brand' => 'nullable|string|max:50',
            'serial_no' => 'nullable|string|max:100',
            'category' => ['sometimes', Rule::in(['furniture', 'appliance', 'electronics', 'plumbing', 'electrical', 'hvac', 'security', 'other'])],
            'status' => ['sometimes', Rule::in(['working', 'faulty', 'maintenance', 'retired'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $asset->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Asset updated successfully',
                'asset' => $asset
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update asset',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update asset status
     */
    public function updateStatus(Request $request, Asset $asset): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => ['required', Rule::in(['working', 'maintenance'])],
            'maintenance_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $updateData = ['status' => $request->status];
            
            // Only update maintenance notes if status is maintenance
            if ($request->status === 'maintenance' && $request->has('maintenance_notes')) {
                $updateData['maintenance_notes'] = $request->maintenance_notes;
            } elseif ($request->status === 'working') {
                // Clear maintenance notes when status is working
                $updateData['maintenance_notes'] = null;
            }
            
            $asset->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Asset status updated successfully',
                'asset' => $asset
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update asset status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified asset
     */
    public function destroy(Asset $asset): JsonResponse
    {
        try {
            $asset->delete();

            return response()->json([
                'success' => true,
                'message' => 'Asset deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete asset',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}