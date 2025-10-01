<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentInvoice;
use App\Models\Tenant;
use App\Models\RentalUnit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RentInvoiceController extends Controller
{
    /**
     * Display a listing of rent invoices
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = RentInvoice::with(['tenant', 'property', 'rentalUnit']);

            // Status filter
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Month filter
            if ($request->has('month') && $request->month) {
                $query->whereMonth('invoice_date', $request->month);
            }

            // Year filter
            if ($request->has('year') && $request->year) {
                $query->whereYear('invoice_date', $request->year);
            }

            // Tenant filter
            if ($request->has('tenant_id') && $request->tenant_id) {
                $query->where('tenant_id', $request->tenant_id);
            }

            $invoices = $query->orderBy('invoice_date', 'desc')->get();

            return response()->json([
                'invoices' => $invoices
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch rent invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created rent invoice
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required|exists:tenants,id',
            'rental_unit_id' => 'required|exists:rental_units,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after:invoice_date',
            'rent_amount' => 'required|numeric|min:0',
            'late_fee' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Get rental unit and property info
            $rentalUnit = RentalUnit::with('property')->find($request->rental_unit_id);
            $tenant = Tenant::find($request->tenant_id);

            if (!$rentalUnit || !$tenant) {
                return response()->json([
                    'message' => 'Rental unit or tenant not found'
                ], 404);
            }

            // Generate invoice number
            $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad(RentInvoice::count() + 1, 6, '0', STR_PAD_LEFT);

            // Calculate total amount
            $rentAmount = $request->rent_amount;
            $lateFee = $request->late_fee ?? 0;
            $totalAmount = $rentAmount + $lateFee;

            $invoice = RentInvoice::create([
                'invoice_number' => $invoiceNumber,
                'tenant_id' => $request->tenant_id,
                'property_id' => $rentalUnit->property_id,
                'rental_unit_id' => $request->rental_unit_id,
                'invoice_date' => $request->invoice_date,
                'due_date' => $request->due_date,
                'rent_amount' => $rentAmount,
                'late_fee' => $lateFee,
                'total_amount' => $totalAmount,
                'currency' => $rentalUnit->financial['currency'] ?? 'MVR',
                'status' => 'pending',
                'notes' => $request->notes,
            ]);

            $invoice->load(['tenant', 'property', 'rentalUnit']);

            DB::commit();

            return response()->json([
                'message' => 'Rent invoice created successfully',
                'invoice' => $invoice
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create rent invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified rent invoice
     */
    public function show(RentInvoice $rentInvoice): JsonResponse
    {
        try {
            $rentInvoice->load(['tenant', 'property', 'rentalUnit']);

            return response()->json([
                'invoice' => $rentInvoice
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch rent invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified rent invoice
     */
    public function update(Request $request, RentInvoice $rentInvoice): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:pending,paid,overdue,cancelled',
            'paid_date' => 'nullable|date',
            'payment_details' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $updateData = $request->only(['status', 'paid_date', 'payment_details', 'notes']);

            // If marking as paid, set paid_date if not provided
            if ($request->status === 'paid' && !$request->paid_date) {
                $updateData['paid_date'] = now()->toDateString();
            }

            $rentInvoice->update($updateData);
            $rentInvoice->load(['tenant', 'property', 'rentalUnit']);

            return response()->json([
                'message' => 'Rent invoice updated successfully',
                'invoice' => $rentInvoice
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update rent invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified rent invoice
     */
    public function destroy(RentInvoice $rentInvoice): JsonResponse
    {
        try {
            $rentInvoice->delete();

            return response()->json([
                'message' => 'Rent invoice deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete rent invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate monthly rent invoices for all occupied rental units
     */
    public function generateMonthlyInvoices(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
            'due_date_offset' => 'nullable|integer|min:1|max:31', // Days after invoice date
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            DB::beginTransaction();

            $month = $request->month;
            $year = $request->year;
            $dueDateOffset = $request->due_date_offset ?? 7; // Default 7 days

            // Get all occupied rental units
            $occupiedUnits = RentalUnit::with(['tenant', 'property'])
                ->where('status', 'occupied')
                ->whereNotNull('tenant_id')
                ->get();

            $generatedInvoices = [];
            $errors = [];

            foreach ($occupiedUnits as $unit) {
                try {
                    // Check if invoice already exists for this month/year
                    $existingInvoice = RentInvoice::where('tenant_id', $unit->tenant_id)
                        ->where('rental_unit_id', $unit->id)
                        ->whereYear('invoice_date', $year)
                        ->whereMonth('invoice_date', $month)
                        ->first();

                    if ($existingInvoice) {
                        $errors[] = "Invoice already exists for {$unit->tenant->personal_info['firstName']} {$unit->tenant->personal_info['lastName']} - Unit {$unit->unit_number}";
                        continue;
                    }

                    // Generate unique invoice number
                    $invoiceNumber = 'INV-' . $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . $unit->id . '-' . uniqid();
                    $invoiceDate = Carbon::create($year, $month, 1)->toDateString();
                    $dueDate = Carbon::create($year, $month, 1)->addDays($dueDateOffset)->toDateString();
                    $rentAmount = $unit->financial['rentAmount'] ?? 0;

                    $invoice = RentInvoice::create([
                        'invoice_number' => $invoiceNumber,
                        'tenant_id' => $unit->tenant_id,
                        'property_id' => $unit->property_id,
                        'rental_unit_id' => $unit->id,
                        'invoice_date' => $invoiceDate,
                        'due_date' => $dueDate,
                        'rent_amount' => $rentAmount,
                        'late_fee' => 0,
                        'total_amount' => $rentAmount,
                        'currency' => $unit->financial['currency'] ?? 'MVR',
                        'status' => 'pending',
                        'notes' => "Monthly rent for {$unit->property->name} - Unit {$unit->unit_number}",
                    ]);

                    $invoice->load(['tenant', 'property', 'rentalUnit']);
                    $generatedInvoices[] = $invoice;

                } catch (\Exception $e) {
                    $errors[] = "Failed to generate invoice for Unit {$unit->unit_number}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Monthly rent invoices generated successfully',
                'generated_count' => count($generatedInvoices),
                'invoices' => $generatedInvoices,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to generate monthly rent invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark invoice as paid
     */
    public function markAsPaid(Request $request, RentInvoice $rentInvoice): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_details' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $rentInvoice->markAsPaid($request->payment_details);
            
            if ($request->notes) {
                $rentInvoice->update(['notes' => $request->notes]);
            }

            $rentInvoice->load(['tenant', 'property', 'rentalUnit']);

            return response()->json([
                'message' => 'Invoice marked as paid successfully',
                'invoice' => $rentInvoice
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark invoice as paid',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get invoice statistics
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $currentMonth = now()->month;
            $currentYear = now()->year;

            $stats = [
                'total_invoices' => RentInvoice::count(),
                'pending_invoices' => RentInvoice::pending()->count(),
                'paid_invoices' => RentInvoice::paid()->count(),
                'overdue_invoices' => RentInvoice::overdue()->count(),
                'current_month_invoices' => RentInvoice::forMonth($currentYear, $currentMonth)->count(),
                'current_month_pending' => RentInvoice::forMonth($currentYear, $currentMonth)->pending()->count(),
                'current_month_paid' => RentInvoice::forMonth($currentYear, $currentMonth)->paid()->count(),
                'total_amount_pending' => RentInvoice::pending()->sum('total_amount'),
                'total_amount_paid' => RentInvoice::paid()->sum('total_amount'),
            ];

            return response()->json([
                'statistics' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch invoice statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
