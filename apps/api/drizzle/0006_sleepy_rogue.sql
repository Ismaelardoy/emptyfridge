CREATE INDEX "items_list_order_idx" ON "items" USING btree ("list_id","checked","created_at");--> statement-breakpoint
CREATE INDEX "items_list_name_idx" ON "items" USING btree ("list_id","normalized_name");--> statement-breakpoint
CREATE INDEX "lists_household_created_idx" ON "lists" USING btree ("household_id","created_at");