<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\PaymentType;

class PaymentTypeController extends Controller
{
    /**
     * Display a listing of payment types
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PaymentType::query();
            
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
            
            $paymentTypes = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'payment_types' => $paymentTypes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment types',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created payment type
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255|unique:payment_types',
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
            $paymentType = PaymentType::create([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->boolean('is_active', true),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment type created successfully',
                'payment_type' => $paymentType
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment type',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified payment type
     */
    public function show(PaymentType $paymentType): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'payment_type' => $paymentType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment type',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified payment type
     */
    public function update(Request $request, PaymentType $paymentType): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255|unique:payment_types,name,' . $paymentType->id,
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
            $paymentType->update([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->boolean('is_active', true),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment type updated successfully',
                'payment_type' => $paymentType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment type',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified payment type
     */
    public function destroy(PaymentType $paymentType): JsonResponse
    {
        try {
            $paymentType->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payment type deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete payment type',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}