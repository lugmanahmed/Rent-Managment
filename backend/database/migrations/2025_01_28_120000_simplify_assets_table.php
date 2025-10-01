<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            // Drop unnecessary columns
            $table->dropColumn([
                'asset_number',
                'model',
                'description',
                'purchase_date',
                'purchase_price',
                'warranty_expiry',
                'supplier',
                'serial_number',
                'status',
                'location',
                'notes',
                'is_active'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            // Add back the columns if needed
            $table->string('asset_number')->unique();
            $table->string('model')->nullable();
            $table->text('description')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 10, 2)->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->string('supplier')->nullable();
            $table->string('serial_number')->nullable();
            $table->enum('status', ['working', 'faulty', 'repairing', 'replaced', 'disposed'])->default('working');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
        });
    }
};
