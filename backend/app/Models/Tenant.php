<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'personal_info',
        'contact_info',
        'emergency_contact',
        'employment_info',
        'financial_info',
        'documents',
        'status',
        'notes',
        'lease_start_date',
        'lease_end_date',
    ];

    protected $casts = [
        'personal_info' => 'array',
        'contact_info' => 'array',
        'emergency_contact' => 'array',
        'employment_info' => 'array',
        'financial_info' => 'array',
        'documents' => 'array',
        'lease_start_date' => 'date',
        'lease_end_date' => 'date',
    ];

    protected $attributes = [
        'status' => 'active',
        'personal_info' => '{}',
        'contact_info' => '{}',
        'emergency_contact' => '{}',
        'employment_info' => '{}',
        'financial_info' => '{}',
        'documents' => '[]',
    ];

    // Relationships
    public function rentalUnits(): HasMany
    {
        return $this->hasMany(RentalUnit::class);
    }

    // Accessors
    public function getFirstNameAttribute()
    {
        return $this->personal_info['firstName'] ?? '';
    }

    public function getLastNameAttribute()
    {
        return $this->personal_info['lastName'] ?? '';
    }

    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function getEmailAttribute()
    {
        return $this->contact_info['email'] ?? '';
    }

    public function getPhoneAttribute()
    {
        return $this->contact_info['phone'] ?? '';
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }
}