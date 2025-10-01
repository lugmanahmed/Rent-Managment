<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'street',
        'city',
        'island',
        'postal_code',
        'country',
        'number_of_floors',
        'number_of_rental_units',
        'bedrooms',
        'bathrooms',
        'square_feet',
        'year_built',
        'description',
        'status',
        'photos',
        'amenities',
        'assigned_manager_id',
        'is_active',
    ];

    protected $casts = [
        'photos' => 'array',
        'amenities' => 'array',
        'is_active' => 'boolean',
        'number_of_floors' => 'integer',
        'number_of_rental_units' => 'integer',
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'square_feet' => 'integer',
        'year_built' => 'integer',
        'assigned_manager_id' => 'integer',
    ];

    protected $attributes = [
        'country' => 'Maldives',
        'status' => 'vacant',
        'is_active' => true,
        'photos' => '[]',
        'amenities' => '[]',
    ];

    // Relationships
    public function assignedManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_manager_id');
    }

    public function rentalUnits(): HasMany
    {
        return $this->hasMany(RentalUnit::class);
    }

    // Accessor for full address
    public function getFullAddressAttribute(): string
    {
        return "{$this->street}, {$this->city}, {$this->island}";
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVacant($query)
    {
        return $query->where('status', 'vacant');
    }

    public function scopeOccupied($query)
    {
        return $query->where('status', 'occupied');
    }

    // Method to update property status based on rental unit occupancy
    public function updateStatusBasedOnUnits()
    {
        $totalUnits = $this->rentalUnits()->count();
        $occupiedUnits = $this->rentalUnits()->where('status', 'occupied')->count();
        
        if ($totalUnits === 0) {
            $this->update(['status' => 'vacant']);
        } elseif ($occupiedUnits === $totalUnits) {
            $this->update(['status' => 'occupied']);
        } elseif ($occupiedUnits > 0) {
            $this->update(['status' => 'partially_occupied']);
        } else {
            $this->update(['status' => 'vacant']);
        }
        
        return $this->fresh();
    }

    // Accessor to get current occupancy status
    public function getOccupancyStatusAttribute()
    {
        $totalUnits = $this->rentalUnits()->count();
        $occupiedUnits = $this->rentalUnits()->where('status', 'occupied')->count();
        
        if ($totalUnits === 0) {
            return 'vacant';
        } elseif ($occupiedUnits === $totalUnits) {
            return 'occupied';
        } elseif ($occupiedUnits > 0) {
            return 'partially_occupied';
        } else {
            return 'vacant';
        }
    }
}