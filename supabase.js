const SUPABASE_URL = 'https://ajqhtrthdqjijzuihtmz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FKpUI7h11urJ3e8PVHIjdw_nT7yPDkU';

async function querySupabase(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  return res.json();
}

async function getModel(refNumber) {
  return querySupabase('models', `?ref_number=eq.${refNumber}&limit=1`);
}

async function getFamily(familyName) {
  return querySupabase('families', `?family_name=eq.${familyName}&limit=1`);
}

async function getAllFamilies() {
  return querySupabase('families', '?order=family_name');
}

async function getBezelCode(code) {
  return querySupabase('bezel_codes', `?code=eq.${code}&limit=1`);
}

async function getBraceletCode(code) {
  return querySupabase('bracelet_codes', `?code=eq.${code}&limit=1`);
}

async function getEraPrefix(prefix) {
  return querySupabase('era_prefixes', `?prefix=eq.${prefix}&limit=1`);
}
