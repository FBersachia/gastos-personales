-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "formato" TEXT NOT NULL DEFAULT 'contado';
ALTER TABLE "transactions" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'csv';

-- CreateIndex
CREATE INDEX "transactions_formato_idx" ON "transactions"("formato");

-- CreateIndex
CREATE INDEX "transactions_source_idx" ON "transactions"("source");
