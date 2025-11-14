-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ARS',
ALTER COLUMN "formato" DROP DEFAULT,
ALTER COLUMN "source" DROP DEFAULT;

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DECIMAL(12,4) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rates_userId_idx" ON "exchange_rates"("userId");

-- CreateIndex
CREATE INDEX "exchange_rates_year_month_idx" ON "exchange_rates"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_userId_year_month_currency_key" ON "exchange_rates"("userId", "year", "month", "currency");

-- CreateIndex
CREATE INDEX "transactions_currency_idx" ON "transactions"("currency");

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
