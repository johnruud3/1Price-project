import { createClient } from '@supabase/supabase-js';

let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

export interface CleanupStats {
  deleted_count: number;
  cleanup_date: string;
  retention_days: number;
}

export async function cleanupOldSubmissions(retentionDays: number = 180): Promise<CleanupStats> {
  const client = getSupabaseClient();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error, count } = await client
    .from('price_submissions')
    .delete({ count: 'exact' })
    .lt('submitted_at', cutoffDate.toISOString());

  if (error) {
    throw new Error(`Cleanup failed: ${error.message}`);
  }

  return {
    deleted_count: count || 0,
    cleanup_date: new Date().toISOString(),
    retention_days: retentionDays,
  };
}

export async function getStorageStats() {
  const client = getSupabaseClient();

  // Get total submissions
  const { count: totalCount, error: countError } = await client
    .from('price_submissions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Failed to get total count: ${countError.message}`);
  }

  // Get submissions by age
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const { count: last30Days } = await client
    .from('price_submissions')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', thirtyDaysAgo.toISOString());

  const { count: last90Days } = await client
    .from('price_submissions')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', ninetyDaysAgo.toISOString());

  const { count: last180Days } = await client
    .from('price_submissions')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', oneEightyDaysAgo.toISOString());

  const { count: olderThan180Days } = await client
    .from('price_submissions')
    .select('*', { count: 'exact', head: true })
    .lt('submitted_at', oneEightyDaysAgo.toISOString());

  // Get oldest submission
  const { data: oldestSubmission } = await client
    .from('price_submissions')
    .select('submitted_at')
    .order('submitted_at', { ascending: true })
    .limit(1)
    .single();

  // Estimate storage size (rough estimate: 200 bytes per submission)
  const estimatedSizeMB = ((totalCount || 0) * 200) / (1024 * 1024);

  return {
    total_submissions: totalCount || 0,
    last_30_days: last30Days || 0,
    last_90_days: last90Days || 0,
    last_180_days: last180Days || 0,
    older_than_180_days: olderThan180Days || 0,
    oldest_submission: oldestSubmission?.submitted_at || null,
    estimated_size_mb: Math.round(estimatedSizeMB * 100) / 100,
    next_cleanup_eligible: olderThan180Days || 0,
  };
}
