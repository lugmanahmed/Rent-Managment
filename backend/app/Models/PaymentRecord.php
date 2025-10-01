<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\RentalUnit;
use App\Models\Tenant;
use App\Models\Property;
class PaymentRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'unit_id',
        'amount',
        'payment_type_id',
        'payment_mode_id',
        'paid_date',
        'paid_by',
        'mobile_no',
        'blaz_no',
        'account_name',
        'account_no',
        'bank',
        'cheque_no',
        'currency_id',
        'remarks',
        'created_by_id',
        'is_active',
    ];

    protected $casts = [
        'paid_date' => 'datetime',
        'amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get the rental unit that owns the payment record.
     */
    public function rentalUnit()
    {
        return $this->belongsTo(RentalUnit::class, 'unit_id');
    }

    /**
     * Get the tenant through the rental unit.
     */
    public function tenant()
    {
        return $this->hasOneThrough(Tenant::class, RentalUnit::class, 'id', 'id', 'unit_id', 'tenant_id');
    }

    /**
     * Get the property through the rental unit.
     */
    public function property()
    {
        return $this->hasOneThrough(Property::class, RentalUnit::class, 'id', 'id', 'unit_id', 'property_id');
    }

    /**
     * Get the payment type for this payment record.
     */
    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }

    /**
     * Get the payment mode for this payment record.
     */
    public function paymentMode()
    {
        return $this->belongsTo(PaymentMode::class);
    }

    /**
     * Scope a query to only include completed payment records.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include pending payment records.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
