<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceCost;
use App\Models\RentalUnitAsset;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MaintenanceCostController extends Controller
{
    /**
     * Display a listing of maintenance costs
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = MaintenanceCost::with(['rentalUnitAsset.asset', 'rentalUnitAsset.rentalUnit.property']);

            // Status filter
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Date range filter
            if ($request->has('date_from') && $request->date_from) {
                $query->where('repair_date', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->where('repair_date', '<=', $request->date_to);
            }

            $maintenanceCosts = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'maintenance_costs' => $maintenanceCosts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch maintenance costs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created maintenance cost
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rental_unit_asset_id' => 'required|exists:rental_unit_assets,id',
            'repair_cost' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'description' => 'nullable|string|max:1000',
            'repair_date' => 'nullable|date',
            'repair_provider' => 'nullable|string|max:255',
            'status' => 'nullable|in:draft,pending,paid,rejected',
            'notes' => 'nullable|string|max:1000',
            'bills' => 'nullable|array',
            'bills.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $attachedBills = [];
            
            // Handle file uploads
            if ($request->hasFile('bills')) {
                foreach ($request->file('bills') as $file) {
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('maintenance_bills', $filename, 'public');
                    $attachedBills[] = $path;
                }
            }

            $maintenanceCost = MaintenanceCost::create([
                'rental_unit_asset_id' => $request->rental_unit_asset_id,
                'repair_cost' => $request->repair_cost,
                'currency' => $request->currency ?? 'MVR',
                'description' => $request->description,
                'attached_bills' => $attachedBills,
                'repair_date' => $request->repair_date,
                'repair_provider' => $request->repair_provider,
                'status' => 'draft', // Set as draft initially - only visible after Done button
                'notes' => $request->notes,
            ]);

            $maintenanceCost->load(['rentalUnitAsset.asset', 'rentalUnitAsset.rentalUnit.property']);

            return response()->json([
                'success' => true,
                'message' => 'Maintenance cost created successfully',
                'maintenance_cost' => $maintenanceCost
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create maintenance cost',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified maintenance cost
     */
    public function show(MaintenanceCost $maintenanceCost): JsonResponse
    {
        try {
            $maintenanceCost->load(['rentalUnitAsset.asset', 'rentalUnitAsset.rentalUnit.property']);

            return response()->json([
                'success' => true,
                'maintenance_cost' => $maintenanceCost
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch maintenance cost',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified maintenance cost
     */
    public function update(Request $request, MaintenanceCost $maintenanceCost): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'repair_cost' => 'sometimes|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'description' => 'nullable|string|max:1000',
            'repair_date' => 'nullable|date',
            'repair_provider' => 'nullable|string|max:255',
            'status' => 'sometimes|in:draft,pending,paid,rejected',
            'notes' => 'nullable|string|max:1000',
            'bills' => 'nullable|array',
            'bills.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            // Check if request is JSON or FormData
            $isJson = $request->isJson() || $request->header('Content-Type') === 'application/json';
            
            if ($isJson) {
                // Handle JSON request
                $updateData = $request->only([
                    'repair_cost', 'currency', 'description', 'repair_date', 
                    'repair_provider', 'status', 'notes'
                ]);
                
                Log::info('🔍 DEBUG: JSON request processing', [
                    'update_data' => $updateData,
                    'is_json' => true
                ]);
            } else {
                // Handle FormData request using $_POST directly
                $updateData = [];
                
                // Get repair_cost
                $repairCost = $_POST['repair_cost'] ?? null;
                if ($repairCost !== null && $repairCost !== '') {
                    $updateData['repair_cost'] = $repairCost;
                }
                
                // Get currency
                $currency = $_POST['currency'] ?? null;
                if ($currency !== null && $currency !== '') {
                    $updateData['currency'] = $currency;
                }
                
                // Get description
                $description = $_POST['description'] ?? null;
                if ($description !== null && $description !== '') {
                    $updateData['description'] = $description;
                }
                
                // Get repair_date
                $repairDate = $_POST['repair_date'] ?? null;
                if ($repairDate !== null && $repairDate !== '') {
                    $updateData['repair_date'] = $repairDate;
                }
                
                // Get repair_provider
                $repairProvider = $_POST['repair_provider'] ?? null;
                if ($repairProvider !== null && $repairProvider !== '') {
                    $updateData['repair_provider'] = $repairProvider;
                }
                
                // Get notes
                $notes = $_POST['notes'] ?? null;
                if ($notes !== null && $notes !== '') {
                    $updateData['notes'] = $notes;
                }
                
                // Get status
                $status = $_POST['status'] ?? null;
                if ($status !== null && $status !== '') {
                    $updateData['status'] = $status;
                }

                Log::info('🔍 DEBUG: FormData processing with $_POST', [
                    'repair_cost' => $repairCost,
                    'currency' => $currency,
                    'description' => $description,
                    'repair_date' => $repairDate,
                    'repair_provider' => $repairProvider,
                    'notes' => $notes,
                    'status' => $status,
                    'update_data' => $updateData,
                    'raw_post' => $_POST
                ]);
            }

            Log::info('Maintenance Cost Update Request', [
                'id' => $maintenanceCost->id,
                'update_data' => $updateData
            ]);
            
            // Always set status to draft when updating (unless explicitly provided)
            if (!isset($updateData['status']) || $updateData['status'] === null || $updateData['status'] === '') {
                $updateData['status'] = 'draft';
            }

            Log::info('Final update data', ['update_data' => $updateData]);

            // Handle new file uploads (only for FormData requests)
            if (!$isJson && $request->hasFile('bills')) {
                $attachedBills = $maintenanceCost->attached_bills ?? [];
                
                foreach ($request->file('bills') as $file) {
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('maintenance_bills', $filename, 'public');
                    $attachedBills[] = $path;
                }
                
                $updateData['attached_bills'] = $attachedBills;
            }

            $maintenanceCost->update($updateData);
            $maintenanceCost->load(['rentalUnitAsset.asset', 'rentalUnitAsset.rentalUnit.property']);

            Log::info('Maintenance Cost Updated Successfully', [
                'id' => $maintenanceCost->id,
                'updated_data' => $maintenanceCost->toArray()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Maintenance cost updated successfully',
                'maintenance_cost' => $maintenanceCost
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update maintenance cost',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified maintenance cost
     */
    public function destroy(MaintenanceCost $maintenanceCost): JsonResponse
    {
        try {
            // Delete attached files
            if ($maintenanceCost->attached_bills) {
                foreach ($maintenanceCost->attached_bills as $bill) {
                    Storage::disk('public')->delete($bill);
                }
            }

            $maintenanceCost->delete();

            return response()->json([
                'success' => true,
                'message' => 'Maintenance cost deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete maintenance cost',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get maintenance costs for a specific rental unit asset
     */
    public function getByRentalUnitAsset($rentalUnitAssetId): JsonResponse
    {
        try {
            $maintenanceCosts = MaintenanceCost::with(['rentalUnitAsset.asset', 'rentalUnitAsset.rentalUnit.property'])
                ->where('rental_unit_asset_id', $rentalUnitAssetId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'maintenance_costs' => $maintenanceCosts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch maintenance costs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
