import { Router, Request, Response } from 'express';
import { getAllRecentPrices } from '../services/databaseService.js';

const router = Router();

interface GroupedPrice {
  barcode: string;
  product_name: string;
  min_price: number;
  max_price: number;
  submission_count: number;
  currency: string;
  stores: string[];
  locations: string[];
  latest_submission: string;
}

// Group prices within ±0.50 NOK tolerance
router.get('/grouped', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const allPrices = await getAllRecentPrices(limit * 3); // Fetch more to account for grouping

    // Group by barcode and price range (±0.50 NOK)
    const grouped = new Map<string, GroupedPrice>();

    for (const submission of allPrices) {
      const key = submission.barcode;

      if (!grouped.has(key)) {
        // First submission for this product
        grouped.set(key, {
          barcode: submission.barcode,
          product_name: submission.product_name,
          min_price: submission.price,
          max_price: submission.price,
          submission_count: 1,
          currency: submission.currency,
          stores: submission.store_name ? [submission.store_name] : [],
          locations: submission.location ? [submission.location] : [],
          latest_submission: submission.submitted_at.toString(),
        });
      } else {
        // Update existing group
        const group = grouped.get(key)!;

        // Check if price is within ±0.50 NOK of existing range
        const withinRange =
          submission.price >= group.min_price - 0.50 &&
          submission.price <= group.max_price + 0.50;

        if (withinRange) {
          // Add to existing group
          group.min_price = Math.min(group.min_price, submission.price);
          group.max_price = Math.max(group.max_price, submission.price);
          group.submission_count++;

          if (submission.store_name && !group.stores.includes(submission.store_name)) {
            group.stores.push(submission.store_name);
          }

          if (submission.location && !group.locations.includes(submission.location)) {
            group.locations.push(submission.location);
          }

          // Update to latest submission time
          if (new Date(submission.submitted_at) > new Date(group.latest_submission)) {
            group.latest_submission = submission.submitted_at.toString();
          }
        } else {
          // Price is too different, create a new entry with modified barcode key
          const newKey = `${key}_${submission.price}`;
          grouped.set(newKey, {
            barcode: submission.barcode,
            product_name: submission.product_name,
            min_price: submission.price,
            max_price: submission.price,
            submission_count: 1,
            currency: submission.currency,
            stores: submission.store_name ? [submission.store_name] : [],
            locations: submission.location ? [submission.location] : [],
            latest_submission: submission.submitted_at.toString(),
          });
        }
      }
    }

    // Convert to array and sort by latest submission
    const groupedArray = Array.from(grouped.values())
      .sort((a, b) => new Date(b.latest_submission).getTime() - new Date(a.latest_submission).getTime())
      .slice(0, limit);

    res.json({
      count: groupedArray.length,
      prices: groupedArray,
    });
  } catch (error) {
    console.error('Error getting grouped prices:', error);
    res.status(500).json({
      error: 'Failed to get grouped prices',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
