/**
 * ─────────────────────────────────────────────────────────────────────────────
 * price.schema.ts  —  Reusable Price Sub-Schema
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Extracted into its own file so it can be shared across models:
 *   • Product (base price + variant prices)
 *   • Order / OrderItem line totals
 *   • Invoice / Refund amounts
 *
 * The schema is defined with `_id: false` so that embedding it inside a
 * parent document does not generate unnecessary ObjectIds.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Schema } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript interface
// ─────────────────────────────────────────────────────────────────────────────

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "INR" | "AED" | "SGD";

export interface IPriceBlock {
    /** Regular / base price (always required) */
    amount: number;
    /** Sale / discounted price — must be < amount when provided */
    saleAmount?: number;
    /** ISO 4217 currency code */
    currency: Currency;
    /** Optional ISO 8601 date range for a time-boxed sale */
    saleDateFrom?: Date;
    saleDateTo?: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mongoose sub-schema
// ─────────────────────────────────────────────────────────────────────────────

const priceSchema = new Schema<IPriceBlock>(
    {
        amount: {
            type: Number,
            required: [true, "Price amount is required"],
            min: [0, "Price cannot be negative"],
        },
        saleAmount: {
            type: Number,
            min: [0, "Sale price cannot be negative"],
            validate: {
                validator(this: IPriceBlock, val: number) {
                    return val == null || val < this.amount;
                },
                message: "Sale price must be less than the regular price",
            },
        },
        currency: {
            type: String,
            enum: ["USD", "EUR", "GBP", "JPY", "INR", "AED", "SGD"],
            default: "INR",
        },
        saleDateFrom: { type: Date },
        saleDateTo: { type: Date },
    },
    { _id: false }
);

export default priceSchema;
