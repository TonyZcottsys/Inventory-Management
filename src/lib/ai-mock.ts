/**
 * AI layer: uses OpenAI when OPENAI_API_KEY is set, otherwise mock/rule-based behavior.
 */

import OpenAI from "openai";
import { prisma } from "./db";

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key ? new OpenAI({ apiKey: key }) : null;
}

const MOCK_DESCRIPTION =
  "Professional-grade product. Designed for reliability and performance. Ideal for business and consumer use.";

export async function generateDescription(name: string, category?: string): Promise<string> {
  const openai = getOpenAI();
  if (openai) {
    try {
      const prompt = `Write a short, professional product description (2-3 sentences) for: ${name}${category ? ` in the ${category} category.` : "."}`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (e) {
      console.error("OpenAI generateDescription:", e);
    }
  }
  return `${name}${category ? ` – ${category}. ` : ". "}${MOCK_DESCRIPTION}`;
}

export async function getReorderPredictions(): Promise<
  { itemId: string; name: string; suggestedQuantity: number; reason: string }[]
> {
  const low = await prisma.inventoryItem.findMany({
    where: { status: { in: ["LOW_STOCK", "IN_STOCK"] }, reorderLevel: { gt: 0 } },
    select: { id: true, name: true, quantity: true, reorderLevel: true },
  });
  return low
    .filter((i) => i.quantity <= i.reorderLevel * 1.5)
    .map((i) => ({
      itemId: i.id,
      name: i.name,
      suggestedQuantity: Math.max(i.reorderLevel * 2 - i.quantity, 10),
      reason: `Current stock (${i.quantity}) at or near reorder level (${i.reorderLevel}).`,
    }));
}

export async function getInsights(): Promise<{
  frequentlyLowStock: { name: string; id: string; count: number }[];
  categoryTrends: { category: string; totalQty: number; itemCount: number }[];
  valueBreakdown: { category: string; value: number }[];
}> {
  const items = await prisma.inventoryItem.findMany({
    select: { id: true, name: true, status: true, category: true, quantity: true, price: true },
  });
  const lowNames = items.filter((i) => i.status === "LOW_STOCK").map((i) => i.name);
  const freq: Record<string, { name: string; id: string; count: number }> = {};
  lowNames.forEach((name) => {
    const item = items.find((i) => i.name === name);
    if (!item) return;
    if (!freq[item.id]) freq[item.id] = { name: item.name, id: item.id, count: 0 };
    freq[item.id].count++;
  });
  const frequentlyLowStock = Object.values(freq)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const byCat: Record<string, { totalQty: number; itemCount: number; value: number }> = {};
  items.forEach((i) => {
    const cat = i.category || "Uncategorized";
    if (!byCat[cat]) byCat[cat] = { totalQty: 0, itemCount: 0, value: 0 };
    byCat[cat].totalQty += i.quantity;
    byCat[cat].itemCount += 1;
    byCat[cat].value += i.quantity * (i.price ? Number(i.price) : 0);
  });
  const categoryTrends = Object.entries(byCat).map(([category, v]) => ({
    category,
    totalQty: v.totalQty,
    itemCount: v.itemCount,
  }));
  const valueBreakdown = Object.entries(byCat).map(([category, v]) => ({
    category,
    value: Math.round(v.value * 100) / 100,
  }));

  return { frequentlyLowStock, categoryTrends, valueBreakdown };
}

function buildInventoryContext(items: { name: string; category: string | null; quantity: number; status: string; reorderLevel: number }[]): string {
  const low = items.filter((i) => i.status === "LOW_STOCK" || i.quantity <= i.reorderLevel);
  const byCategory: Record<string, string[]> = {};
  items.forEach((i) => {
    const cat = i.category || "Uncategorized";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(`${i.name}: ${i.quantity} (reorder at ${i.reorderLevel}), status ${i.status}`);
  });
  let context = `Current inventory summary:\n- Total items: ${items.length}\n- Low stock / below reorder: ${low.map((i) => i.name).join(", ") || "none"}\n`;
  context += "By category:\n" + Object.entries(byCategory).map(([cat, lines]) => `  ${cat}: ${lines.join("; ")}`).join("\n");
  return context;
}

export async function chatQuery(query: string): Promise<string> {
  const items = await prisma.inventoryItem.findMany({
    select: { name: true, category: true, quantity: true, status: true, reorderLevel: true },
  });
  const context = buildInventoryContext(items);

  const openai = getOpenAI();
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an inventory assistant. Answer briefly based only on the following inventory data. If the user asks something not answerable from the data, say so politely.

${context}`,
          },
          { role: "user", content: query },
        ],
        max_tokens: 300,
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (e) {
      console.error("OpenAI chatQuery:", e);
    }
  }

  const q = query.toLowerCase();
  if (q.includes("low") && (q.includes("stock") || q.includes("in stock"))) {
    const low = items.filter((i) => i.status === "LOW_STOCK" || i.quantity <= i.reorderLevel);
    if (low.length === 0) return "No items are currently low in stock.";
    return `The following items are low in stock: ${low.map((i) => `${i.name} (${i.quantity} units)`).join(", ")}.`;
  }
  if (q.includes("reorder") || q.includes("this week")) {
    const reorder = items.filter((i) => i.quantity <= i.reorderLevel && i.status !== "DISCONTINUED");
    if (reorder.length === 0) return "No items need reordering this week.";
    return `Consider reordering: ${reorder.map((i) => i.name).join(", ")}.`;
  }
  if (q.includes("electronic")) {
    const elec = items.filter((i) => (i.category || "").toLowerCase().includes("electronic"));
    const lowElec = elec.filter((i) => i.status === "LOW_STOCK" || i.quantity <= i.reorderLevel);
    if (lowElec.length === 0) return elec.length ? "No electronics are currently low in stock." : "No electronics in inventory.";
    return `Electronics low in stock: ${lowElec.map((i) => i.name).join(", ")}.`;
  }
  return "I can answer questions about low stock, reordering, and categories. Try: 'Which items are low in stock?' or 'What should I reorder this week?'";
}
