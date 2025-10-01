<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\RentalUnitController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\PaymentModeController;
use App\Http\Controllers\Api\PaymentTypeController;
use App\Http\Controllers\Api\PaymentRecordController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RentInvoiceController;
use App\Http\Controllers\Api\MaintenanceCostController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/settings/dropdowns', [SettingsController::class, 'getDropdowns']); // Public route

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/update-profile', [AuthController::class, 'updateProfile']);

    // Property routes
    Route::apiResource('properties', PropertyController::class);
    Route::get('/properties/{property}/capacity', [PropertyController::class, 'capacity']);

    // Rental Unit routes
    Route::get('/rental-units/maintenance-assets', [RentalUnitController::class, 'getMaintenanceAssets']);
    Route::apiResource('rental-units', RentalUnitController::class)->parameters([
        'rental-units' => 'rentalUnit'
    ]);
    Route::get('/rental-units/property/{property}', [RentalUnitController::class, 'getByProperty']);
    Route::post('/rental-units/{rentalUnit}/assets', [RentalUnitController::class, 'addAssets']);
    Route::delete('/rental-units/{rentalUnit}/assets/{asset}', [RentalUnitController::class, 'removeAsset']);
    Route::get('/rental-units/{rentalUnit}/assets', [RentalUnitController::class, 'getAssets']);
    Route::patch('/rental-units/{rentalUnit}/assets/{assetId}/status', [RentalUnitController::class, 'updateAssetStatus']);

    // Asset routes
    Route::apiResource('assets', AssetController::class);
    Route::patch('/assets/{asset}/status', [AssetController::class, 'updateStatus']);

    // Tenant routes
    Route::apiResource('tenants', TenantController::class);

    // Dashboard routes
    Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);
    Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity']);

    // Payment routes
    Route::apiResource('payments', PaymentController::class);
    Route::get('/payments/statistics', [PaymentController::class, 'statistics']);

    // Currency routes
    Route::apiResource('currencies', CurrencyController::class);
    Route::get('/currencies/base', [CurrencyController::class, 'base']);
    Route::post('/currencies/convert', [CurrencyController::class, 'convert']);

    // Payment Mode routes
    Route::apiResource('payment-modes', PaymentModeController::class);

    // Payment Type routes
    Route::apiResource('payment-types', PaymentTypeController::class);

    // Payment Record routes
    Route::apiResource('payment-records', PaymentRecordController::class);

    // Maintenance routes
    Route::apiResource('maintenance', MaintenanceController::class);

    // Maintenance Cost routes
    Route::apiResource('maintenance-costs', MaintenanceCostController::class);
    Route::get('/maintenance-costs/rental-unit-asset/{rentalUnitAssetId}', [MaintenanceCostController::class, 'getByRentalUnitAsset']);

    // User routes
    Route::apiResource('users', UserController::class);

    // Rent Invoice routes
    Route::apiResource('rent-invoices', RentInvoiceController::class);
    Route::post('/rent-invoices/generate-monthly', [RentInvoiceController::class, 'generateMonthlyInvoices']);
    Route::patch('/rent-invoices/{rentInvoice}/mark-paid', [RentInvoiceController::class, 'markAsPaid']);
    Route::get('/rent-invoices/statistics', [RentInvoiceController::class, 'getStatistics']);
});
