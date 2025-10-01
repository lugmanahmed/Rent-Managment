<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\PaymentMode;

class PaymentModeController extends Controller
{
    /**
     * Display a listing of payment modes
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PaymentMode::query();
            
            // Apply filters if provided
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }
            
            if ($request->has('status')) {
                $query->where('is_active', $request->get('status') === 'active');
            }
            
            $paymentModes = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'payment_modes' => $paymentModes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment modes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created payment mode
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255|unique:payment_modes',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $paymentMode = PaymentMode::create([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->boolean('is_active', true),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment mode created successfully',
                'payment_mode' => $paymentMode
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment mode',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified payment mode
     */
    public function show(PaymentMode $paymentMode): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'payment_mode' => $paymentMode
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment mode',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified payment mode
     */
    public function update(Request $request, PaymentMode $paymentMode): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255|unique:payment_modes,name,' . $paymentMode->id,
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $paymentMode->update([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->boolean('is_active', true),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment mode updated successfully',
                'payment_mode' => $paymentMode
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment mode',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified payment mode
     */
    public function destroy(PaymentMode $paymentMode): JsonResponse
    {
        try {
            $paymentMode->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payment mode deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete payment mode',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}