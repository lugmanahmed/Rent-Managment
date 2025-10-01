<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RentalUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'unit_number',
        'floor_number',
        'unit_details',
        'financial',
        'status',
        'tenant_id',
        'move_in_date',
        'lease_end_date',
        'amenities',
        'photos',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'unit_details' => 'array',
        'financial' => 'array',
        'amenities' => 'array',
        'photos' => 'array',
        'is_active' => 'boolean',
        'floor_number' => 'integer',
        'property_id' => 'integer',
        'tenant_id' => 'integer',
        'move_in_date' => 'date',
        'lease_end_date' => 'date',
    ];

    protected $attributes = [
        'status' => 'available',
        'is_active' => true,
        'unit_details' => '[]',
        'financial' => '[]',
        'amenities' => '[]',
        'photos' => '[]',
    ];

    // Relationships
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function assets(): BelongsToMany
    {
        return $this->belongsToMany(Asset::class, 'rental_unit_assets')
            ->withPivot(['assigned_date', 'notes', 'is_active', 'quantity', 'status', 'maintenance_notes'])
            ->withTimestamps()
            ->wherePivot('is_active', true)
            ->orderBy('rental_unit_assets.updated_at', 'desc');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeOccupied($query)
    {
        return $query->where('status', 'occupied');
    }

    // Accessors
    public function getRentAmountAttribute()
    {
        return $this->financial['rentAmount'] ?? 0;
    }

    public function getDepositAmountAttribute()
    {
        return $this->financial['depositAmount'] ?? 0;
    }

    public function getCurrencyAttribute()
    {
        return $this->financial['currency'] ?? 'MVR';
    }

    public function getNumberOfRoomsAttribute()
    {
        return $this->unit_details['numberOfRooms'] ?? 0;
    }

    public function getNumberOfToiletsAttribute()
    {
        return $this->unit_details['numberOfToilets'] ?? 0;
    }
}