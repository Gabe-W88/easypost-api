import * as React from "react"
import { useState } from "react"

const SHIPPING_DATA = [
    {
        "Shipping Type": "Domestic (within US)",
        "Shipping Rate": "Standard",
        "Processing Fee": 69,
        "Shipping Price": 9,
        "Min Days": 5,
        "Max Days": 7,
        Note: "",
    },
    {
        "Shipping Type": "Domestic (within US)",
        "Shipping Rate": "Fast",
        "Processing Fee": 99,
        "Shipping Price": 19,
        "Min Days": 3,
        "Max Days": 4,
        Note: "",
    },
    {
        "Shipping Type": "Domestic (within US)",
        "Shipping Rate": "Fastest",
        "Processing Fee": 129,
        "Shipping Price": 49,
        "Min Days": 1,
        "Max Days": 2,
        Note: "fastest-domestic",
    },
    {
        "Shipping Type": "International (outside US)",
        "Shipping Rate": "Standard",
        "Processing Fee": 69,
        "Shipping Price": 49,
        "Min Days": 7,
        "Max Days": 10,
        Note: "",
    },
    {
        "Shipping Type": "International (outside US)",
        "Shipping Rate": "Fast",
        "Processing Fee": 99,
        "Shipping Price": 59,
        "Min Days": 4,
        "Max Days": 7,
        Note: "",
    },
    {
        "Shipping Type": "International (outside US)",
        "Shipping Rate": "Fastest",
        "Processing Fee": 129,
        "Shipping Price": 79,
        "Min Days": 2,
        "Max Days": 5,
        Note: "fastest-international",
    },
    {
        "Shipping Type": "Military (APO/FPO/DPO addresses)",
        "Shipping Rate": "Standard",
        "Processing Fee": 69,
        "Shipping Price": 0,
        "Min Days": 8,
        "Max Days": 15,
        Note: "",
    },
    {
        "Shipping Type": "Military (APO/FPO/DPO addresses)",
        "Shipping Rate": "Fast",
        "Processing Fee": 99,
        "Shipping Price": 0,
        "Min Days": 6,
        "Max Days": 12,
        Note: "",
    },
    {
        "Shipping Type": "Military (APO/FPO/DPO addresses)",
        "Shipping Rate": "Fastest",
        "Processing Fee": 129,
        "Shipping Price": 0,
        "Min Days": 5,
        "Max Days": 11,
        Note: "fastest-military",
    },
    {
        "Shipping Type": "Shipping with previous order",
        "Shipping Rate": "Standard",
        "Processing Fee": 69,
        "Shipping Price": 0,
        "Min Days": "-",
        "Max Days": "-",
        Note: "",
    },
    {
        "Shipping Type": "Shipping with previous order",
        "Shipping Rate": "Fast",
        "Processing Fee": 99,
        "Shipping Price": 0,
        "Min Days": "-",
        "Max Days": "-",
        Note: "",
    },
    {
        "Shipping Type": "Shipping with previous order",
        "Shipping Rate": "Fastest",
        "Processing Fee": 129,
        "Shipping Price": 0,
        "Min Days": "-",
        "Max Days": "-",
        Note: "fastest-shipping-with-order",
    },
]

const shippingOptions = [
    "Domestic (within US)",
    "International (outside US)",
    "Military (APO/FPO/DPO addresses)",
    "Shipping with previous order",
]

const speedOptions = [
    {
        label: "Standard",
        description: "3–5 business days processing plus standard shipping",
    },
    {
        label: "Fast",
        description: "1–2 business days processing plus expedited shipping",
    },
    {
        label: "Fastest",
        description: "Same-day processing plus fastest possible shipping",
    },
]

export default function PricingCalculator() {
    const [shippingType, setShippingType] = useState("Domestic (within US)")
    const [shippingRate, setShippingRate] = useState("Standard")

    const data = SHIPPING_DATA.find(
        (d) =>
            d["Shipping Type"] === shippingType &&
            d["Shipping Rate"] === shippingRate
    )

    const processing = data?.["Processing Fee"] || 0
    const shipping = data?.["Shipping Price"] || 0
    const booklet = 20
    const subtotal = processing + shipping + booklet
    const tax = +(subtotal * 0.0775).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    const min = data?.["Min Days"] || "-"
    const max = data?.["Max Days"] || "-"
    const note = data?.["Note"]

    return (
        <div style={{ fontFamily: "Inter, sans-serif", padding: 20 }}>
            {/* Removed heading and description */}

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 40,
                    marginBottom: 40,
                }}
            >
                {/* Shipping Options */}
                <div style={{ flex: "1 1 280px", maxWidth: "400px" }}>
                    <h4
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 12,
                        }}
                    >
                        Where are you shipping?
                    </h4>
                    {shippingOptions.map((option) => (
                        <button
                            key={option}
                            onClick={() => setShippingType(option)}
                            style={{
                                display: "block",
                                width: "100%",
                                textAlign: "left",
                                padding: "1rem",
                                marginBottom: "10px",
                                borderRadius: "10px",
                                border:
                                    shippingType === option
                                        ? "2px solid #02569E"
                                        : "1px solid #ddd",
                                background:
                                    shippingType === option
                                        ? "#02569E"
                                        : "#fff",
                                color:
                                    shippingType === option ? "#fff" : "#111",
                                fontSize: 15,
                                fontWeight: shippingType === option ? 600 : 500,
                                cursor: "pointer",
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {/* Speed Options */}
                <div style={{ flex: "1 1 280px", maxWidth: "400px" }}>
                    <h4
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 12,
                        }}
                    >
                        How fast do you need it?
                    </h4>
                    {speedOptions.map(({ label, description }) => (
                        <button
                            key={label}
                            onClick={() => setShippingRate(label)}
                            style={{
                                display: "block",
                                width: "100%",
                                textAlign: "left",
                                padding: "1rem",
                                marginBottom: "10px",
                                borderRadius: "10px",
                                border:
                                    shippingRate === label
                                        ? "2px solid #02569E"
                                        : "1px solid #ddd",
                                background:
                                    shippingRate === label ? "#02569E" : "#fff",
                                color: shippingRate === label ? "#fff" : "#111",
                                fontSize: 15,
                                fontWeight: shippingRate === label ? 600 : 500,
                                cursor: "pointer",
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>{label}</div>
                            <div style={{ fontSize: 13, opacity: 0.8 }}>
                                {description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quote Box */}
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div
                    style={{
                        background: "#fff",
                        padding: 24,
                        borderRadius: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    <h3
                        style={{
                            fontSize: 20,
                            fontWeight: 700,
                            marginBottom: 20,
                        }}
                    >
                        Your Quote
                    </h3>
                    {[
                        ["Processing Fee", processing],
                        ["Shipping Fee", shipping],
                        ["International Driving Permit Booklet", booklet],
                        ["Subtotal", subtotal],
                        ["Tax (7.75%)", tax],
                    ].map(([label, value], i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: i >= 3 ? 15 : 14,
                                fontWeight: i >= 3 ? 500 : 400,
                                marginTop: i === 3 ? 12 : 0,
                            }}
                        >
                            <span>{label}</span>
                            <span>${(+value).toFixed(2)}</span>
                        </div>
                    ))}
                    <hr style={{ margin: "1rem 0" }} />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: 700,
                            fontSize: 18,
                            color: "#02569E",
                        }}
                    >
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <div
                        style={{
                            marginTop: 20,
                            background: "#EEF4FF",
                            padding: "12px",
                            borderRadius: "8px",
                        }}
                    >
                        <strong style={{ fontSize: 15 }}>
                            Delivery Timeline
                        </strong>
                        <p style={{ fontSize: 14, margin: 0 }}>
                            {shippingType === "Shipping with previous order"
                                ? "Same as original timeline"
                                : `${min}–${max} business days after you apply`}
                        </p>
                    </div>

                    {note && (
                        <p
                            style={{
                                marginTop: 12,
                                fontSize: 13,
                                color: "#666",
                                fontStyle: "italic",
                            }}
                        >
                            {note === "fastest-international" ? (
                                <>
                                    Only applications received before noon ET can be processed same-day unless we confirm otherwise over chat. If you want to know the exact number of days it will take to ship to your destination, use the <a href="https://www.fedex.com/en-my/new-customer/how-to-get-rates-and-transit-times.html" target="_blank" rel="noopener noreferrer" style={{ color: "#02569E", textDecoration: "underline" }}>FedEx timeline calculator</a> or <a href="https://serious-flows-972417.framer.app/apply" target="_blank" rel="noopener noreferrer" style={{ color: "#02569E", textDecoration: "underline" }}>contact us</a>.
                                </>
                            ) : note === "fastest-domestic" || note === "fastest-military" || note === "fastest-shipping-with-order" ? (
                                "Only applications received before noon ET can be processed same-day unless we confirm otherwise over chat"
                            ) : (
                                note
                            )}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
