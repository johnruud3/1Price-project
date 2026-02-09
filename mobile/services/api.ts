import { API_URL } from '@/utils/config';
import { EvaluateRequest, PriceEvaluation } from '@/types';

export const evaluatePrice = async (
  request: EvaluateRequest
): Promise<PriceEvaluation> => {
  try {
    const response = await fetch(`${API_URL}/api/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      ...data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export interface SubmitPriceRequest {
  barcode: string;
  product_name: string;
  price: number;
  currency: string;
  store_name?: string;
  location?: string;
}

export const submitPrice = async (
  request: SubmitPriceRequest
): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/prices/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Price submission failed:', error);
    throw error;
  }
};
