import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';

const Payments = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track rent payments and payment history.
        </p>
      </div>
      
      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Payments Page</h3>
          <p className="mt-2 text-sm text-gray-500">
            This page will contain payment tracking functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
