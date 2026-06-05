-- CreateIndex
CREATE INDEX "personas_created_at_idx" ON "personas"("created_at" DESC);

-- CreateIndex
CREATE INDEX "personas_tipo_activo_idx" ON "personas"("tipo", "activo");
