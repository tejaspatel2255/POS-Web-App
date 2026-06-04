-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Users can create stores" ON stores;
DROP POLICY IF EXISTS "Users can join store as owner" ON store_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON store_members;
DROP POLICY IF EXISTS "Members can read their store" ON stores;
DROP POLICY IF EXISTS "Owners can update store" ON stores;
DROP POLICY IF EXISTS "authenticated_insert_stores" ON stores;
DROP POLICY IF EXISTS "members_select_stores" ON stores;
DROP POLICY IF EXISTS "owners_update_stores" ON stores;
DROP POLICY IF EXISTS "authenticated_insert_own_membership" ON store_members;
DROP POLICY IF EXISTS "members_select_own_memberships" ON store_members;
DROP POLICY IF EXISTS "owners_manage_members" ON store_members;
DROP POLICY IF EXISTS "owners_delete_members" ON store_members;

-- Enable RLS (in case not enabled)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;

-- STORES policies
CREATE POLICY "authenticated_insert_stores"
ON stores FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "members_select_stores"
ON stores FOR SELECT TO authenticated
USING (
  id IN (
    SELECT store_id FROM store_members WHERE user_id = auth.uid() AND is_active = true
  )
  OR
  NOT EXISTS (
    SELECT 1 FROM store_members WHERE store_id = id
  )
);

CREATE POLICY "owners_update_stores"
ON stores FOR UPDATE TO authenticated
USING (id IN (
  SELECT store_id FROM store_members
  WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
));

-- STORE_MEMBERS policies
CREATE POLICY "authenticated_insert_own_membership"
ON store_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "members_select_own_memberships"
ON store_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR store_id IN (
    SELECT store_id FROM store_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin') AND is_active = true
  )
);

CREATE POLICY "owners_manage_members"
ON store_members FOR UPDATE TO authenticated
USING (store_id IN (
  SELECT store_id FROM store_members
  WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
));

CREATE POLICY "owners_delete_members"
ON store_members FOR DELETE TO authenticated
USING (store_id IN (
  SELECT store_id FROM store_members
  WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
));
