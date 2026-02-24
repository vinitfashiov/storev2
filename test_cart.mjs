import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yqokqlkymnzbeceasrui.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxb2txbGt5bW56YmVjZWFzcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDQxNzksImV4cCI6MjA4NjMyMDE3OX0.cZrlPG8GDr4oWsdZH21XiP_tykiTqVDTOkNUL3WdkNg";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: t, error: e } = await supabase.from("tenants").select("id, store_slug").limit(1).single();
    if (t) {
        console.log("Using tenant:", t.id);
        const { data, error } = await supabase.from("carts").insert({
            tenant_id: t.id,
            store_slug: t.store_slug || "test_slug",
            status: "active"
        }).select().single();
        console.log("Carts Insert:", JSON.stringify({ data, error }, null, 2));

        if (data) {
            // Try inserting into cart_items
            const { data: p } = await supabase.from("products").select("id, price").eq("tenant_id", t.id).limit(1).single();
            if (p) {
                console.log("Using Product:", p.id);
                const { data: ciData, error: ciError } = await supabase.from("cart_items").insert({
                    tenant_id: t.id,
                    cart_id: data.id,
                    product_id: p.id,
                    qty: 1,
                    unit_price: p.price
                }).select().single();
                console.log("Cart_Items Insert:", JSON.stringify({ data: ciData, error: ciError }, null, 2));
            }
        }
    } else {
        console.log("No tenant found", e);
    }
}

run();
