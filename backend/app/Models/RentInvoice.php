<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\PaymentRecord;

class RentInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'tenant_id',
        'property_id',
        'rental_unit_id',
        'invoice_date',
        'due_date',
        'rent_amount',
        'late_fee',
        'total_amount',
        'currency',
        'status',
        'paid_date',
        'notes',
        'payment_details',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'paid_date' => 'date',
        'rent_amount' => 'decimal:2',
        'late_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'payment_details' => 'array',
    ];

    protected $attributes = [
        'status' => 'pending',
        'currency' => 'MVR',
        'late_fee' => 0,
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function rentalUnit(): BelongsTo
    {
        return $this->belongsTo(RentalUnit::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue');
    }

    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('invoice_date', $year)
                    ->whereMonth('invoice_date', $month);
    }

    // Accessors
    public function getIsOverdueAttribute()
    {
        return $this->status === 'pending' && $this->due_date < now()->toDateString();
    }

    public function getFormattedInvoiceNumberAttribute()
    {
        return 'INV-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    // Methods
    public function markAsPaid($paymentDetails = null)
    {
        $this->update([
            'status' => 'paid',
            'paid_date' => now()->toDateString(),
            'payment_details' => $paymentDetails,
        ]);

        // Create a Payment Record entry
        if ($paymentDetails) {
            // Load tenant relationship to get tenant details
            $this->load('tenant');
            
            PaymentRecord::create([
                'unit_id' => $this->rental_unit_id,
                'amount' => $this->total_amount,
                'payment_type_id' => $paymentDetails['payment_type'] ?? null,
                'payment_mode_id' => $paymentDetails['payment_mode'] ?? null,
                'paid_date' => $paymentDetails['payment_date'] ?? now()->toDateString(),
                'paid_by' => $this->tenant->personal_info['firstName'] . ' ' . $this->tenant->personal_info['lastName'],
                'mobile_no' => $this->tenant->contact_info['phone'] ?? null,
                'remarks' => $paymentDetails['notes'] ?? "Payment for invoice {$this->invoice_number}",
                'currency_id' => 1, // Default currency ID (assuming 1 is MVR)
                'created_by_id' => 1, // Default admin user ID
                'is_active' => 1,
            ]);
        }
    }

    public function markAsOverdue()
    {
        $this->update(['status' => 'overdue']);
    }

    public function calculateLateFee($dailyLateFee = 10)
    {
        if ($this->is_overdue) {
            $daysOverdue = now()->diffInDays($this->due_date);
            return $daysOverdue * $dailyLateFee;
        }
        return 0;
    }
}
