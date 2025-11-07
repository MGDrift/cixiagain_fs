-- CreateTable
CREATE TABLE "public"."Kit" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KitItem" (
    "id" SERIAL NOT NULL,
    "kitId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "KitItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KitItem_kitId_productId_key" ON "public"."KitItem"("kitId", "productId");

-- AddForeignKey
ALTER TABLE "public"."KitItem" ADD CONSTRAINT "KitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "public"."Kit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KitItem" ADD CONSTRAINT "KitItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
