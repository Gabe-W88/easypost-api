import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
    Elements,
    PaymentElement,
    AddressElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js"
import heic2any from "https://cdn.skypack.dev/heic2any"

// Initialize Stripe
const stripePromise = loadStripe(
    "pk_test_51P8oMiRtjDxL2xZGzUyexo8wZKuOFmaNW59bMQ526nFjL6JZyDFkrzQXkWRIEkw9cw4eafRRtFLAYqTFwipOBKsx00y7zDiTOv"
)

// Tooltip component for form fields
const Tooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const tooltipRef = useRef(null)

    const handleMouseEnter = (e) => {
        setIsVisible(true)
        const rect = e.currentTarget.getBoundingClientRect()
        setPosition({
            x: rect.right + 10,
            y: rect.top,
        })
    }

    const handleMouseLeave = () => {
        setIsVisible(false)
    }

    return (
        <div
            className="tooltip-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className="tooltip-content"
                    style={{
                        position: "fixed",
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        zIndex: 9999,
                    }}
                >
                    {content}
                </div>
            )}
        </div>
    )
}

// Form field component with optional tooltip support
const FormField = ({
    label,
    name,
    type = "text",
    placeholder,
    required = false,
    options = null,
    value,
    onChange,
    onBlur,
    fieldClass,
    error,
    touched,
    tooltip = null,
}) => (
    <div className={`form-group ${required ? "required" : ""}`}>
        <label className="form-label">
            <span className="label-content">
                {label}
                {required && <span className="required-asterisk"> *</span>}
                {tooltip && (
                    <Tooltip content={tooltip}>
                        <span className="info-icon">ⓘ</span>
                    </Tooltip>
                )}
            </span>
        </label>
        {options ? (
            <select
                className={`form-input ${fieldClass}`}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                onBlur={() => onBlur && onBlur(name)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ) : (
            <input
                type={type}
                className={`form-input ${fieldClass}`}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                onBlur={() => onBlur && onBlur(name)}
            />
        )}
        <div className="error-space">
            {error && touched && (
                <span className="field-error-message">{error}</span>
            )}
        </div>
    </div>
)

// Textarea field component matching FormField format
const TextareaField = ({
    label,
    name,
    placeholder,
    required = false,
    value,
    onChange,
    onBlur,
    fieldClass,
    error,
    touched,
    rows = 3,
    tooltip = null,
}) => (
    <div className={`form-group ${required ? "required" : ""}`}>
        <label className="form-label">
            <span className="label-content">
                {label}
                {required && <span className="required-asterisk"> *</span>}
                {tooltip && (
                    <Tooltip content={tooltip}>
                        <span className="info-icon">ⓘ</span>
                    </Tooltip>
                )}
            </span>
        </label>
        <textarea
            className={`form-input ${fieldClass}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            onBlur={() => onBlur && onBlur(name)}
            rows={rows}
        />
        <div className="error-space">
            {error && touched && (
                <span className="field-error-message">{error}</span>
            )}
        </div>
    </div>
)

// Address field component (moved outside to prevent remounting)
const AddressField = ({
    label,
    name,
    placeholder,
    required = false,
    value,
    onChange,
    onBlur,
    fieldClass,
    addressClass,
    error,
    touched,
    className = "",
}) => (
    <div className={`form-group ${required ? "required" : ""} ${className}`}>
        <label className="form-label">{label}</label>
        <input
            type="text"
            className={`form-input ${fieldClass} ${addressClass}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            onBlur={() => onBlur && onBlur(name)}
        />
        <div className="error-space">
            {error && touched && (
                <span className="field-error-message">{error}</span>
            )}
        </div>
    </div>
)

// International Phone Number component
const InternationalPhoneField = ({
    label,
    name,
    required = false,
    value,
    countryCode,
    onChange,
    onBlur,
    error,
    touched,
    fieldClass = "",
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const selectedCountry =
        countries.find((c) => c.code === countryCode) || countries[0]

    const handleCountrySelect = (country) => {
        onChange(`${name}CountryCode`, country.code)
        setIsDropdownOpen(false)
    }

    const handleDropdownToggle = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDropdownOpen(!isDropdownOpen)
    }

    const handleCountryClick = (country, e) => {
        e.preventDefault()
        e.stopPropagation()
        handleCountrySelect(country)
    }

    return (
        <div className={`form-group ${required ? "required" : ""}`}>
            <label className="form-label">{label}</label>
            <div className="international-phone-container">
                <div
                    ref={dropdownRef}
                    className="country-selector"
                    onClick={handleDropdownToggle}
                    style={{
                        backgroundColor: isDropdownOpen ? "#e9ecef" : "#f8f9fa",
                    }}
                >
                    <span className="flag">{selectedCountry.flag}</span>
                    <span className="dial-code">
                        {selectedCountry.dialCode}
                    </span>
                    <span className="dropdown-arrow">
                        {isDropdownOpen ? "▲" : "▼"}
                    </span>

                    {isDropdownOpen && (
                        <div className="country-dropdown">
                            {countries.map((country) => (
                                <div
                                    key={country.code}
                                    className="country-option"
                                    onClick={(e) =>
                                        handleCountryClick(country, e)
                                    }
                                >
                                    <span className="flag">{country.flag}</span>
                                    <span className="country-name">
                                        {country.name}
                                    </span>
                                    <span className="dial-code">
                                        ({country.dialCode})
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <input
                    type="tel"
                    className={`form-input phone-input ${fieldClass}`}
                    placeholder="(555) 123-4567"
                    value={value}
                    onChange={(e) => {
                        // Only allow digits and limit to 10 characters
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        onChange(name, digits)
                    }}
                    onBlur={() => onBlur && onBlur(name)}
                />
            </div>
            <div className="error-space">
                {error && touched && (
                    <span className="field-error-message">{error}</span>
                )}
            </div>
        </div>
    )
}

// Digital Signature component
const SignatureField = ({
    label,
    name,
    required = false,
    value,
    onChange,
    error,
    touched,
    className = "",
    tooltip = null,
}) => {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Set canvas size properly
        canvas.width = 600
        canvas.height = 150

        const ctx = canvas.getContext('2d')
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }, [])

    const startDrawing = (e) => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        setIsDrawing(true)
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left) * (canvas.width / rect.width)
        const y = (e.clientY - rect.top) * (canvas.height / rect.height)
        
        const ctx = canvas.getContext('2d')
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e) => {
        if (!isDrawing) return
        
        const canvas = canvasRef.current
        if (!canvas) return
        
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left) * (canvas.width / rect.width)
        const y = (e.clientY - rect.top) * (canvas.height / rect.height)
        
        const ctx = canvas.getContext('2d')
        ctx.lineTo(x, y)
        ctx.stroke()
    }

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false)
            const canvas = canvasRef.current
            if (canvas) {
                onChange(name, canvas.toDataURL())
            }
        }
    }

    const clearSignature = () => {
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            onChange(name, '')
        }
    }

    return (
        <div
            className={`form-group signature-field ${required ? "required" : ""} ${className}`}
        >
            <label className="form-label">
                {label}
                {required && <span className="required-asterisk"> *</span>}
                {tooltip && (
                    <Tooltip content={tooltip}>
                        <span className="tooltip-icon">ⓘ</span>
                    </Tooltip>
                )}
            </label>
            <div className="signature-container">
                <canvas
                    ref={canvasRef}
                    className="signature-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{
                        border: "2px solid #ddd",
                        borderRadius: "8px",
                        cursor: "crosshair",
                        backgroundColor: "#fff",
                        width: "100%",
                        maxWidth: "100%",
                        height: "150px",
                        touchAction: "none",
                        userSelect: "none"
                    }}
                />
                <button
                    type="button"
                    onClick={clearSignature}
                    className="btn secondary"
                    style={{ marginTop: "10px" }}
                >
                    Clear Signature
                </button>
            </div>
            <div className="error-space">
                {error && touched && (
                    <span className="field-error-message">{error}</span>
                )}
            </div>
        </div>
    )
}

// Payment component for Step 4
const PaymentForm = ({
    clientSecret,
    onPaymentSuccess,
    onPaymentError,
    formData,
    onFieldChange,
}) => {
    const stripe = useStripe()
    const elements = useElements()
    const [isProcessing, setIsProcessing] = useState(false)
    const [message, setMessage] = useState("")
    const [elementReady, setElementReady] = useState(false)

    // Calculate totals based on form selections
    const calculateTotals = useCallback(() => {
        let permitTotal = 0
        let processingPrice = 0

        // Calculate permit costs ($20 each)
        if (formData.selectedPermits && formData.selectedPermits.length > 0) {
            permitTotal = formData.selectedPermits.length * 20
        }

        // Calculate combined processing + shipping price based on category and speed
        const category = formData.shippingCategory
        const speed = formData.processingOption

        if (category === "domestic") {
            switch (speed) {
                case "standard":
                    processingPrice = 58
                    break
                case "fast":
                    processingPrice = 108
                    break
                case "fastest":
                    processingPrice = 168
                    break
                default:
                    processingPrice = 58 // fallback to standard
            }
        } else if (category === "international") {
            switch (speed) {
                case "standard":
                    processingPrice = 98
                    break
                case "fast":
                    processingPrice = 148
                    break
                case "fastest":
                    processingPrice = 198
                    break
                default:
                    processingPrice = 98 // fallback to standard
            }
        } else if (category === "military") {
            switch (speed) {
                case "standard":
                    processingPrice = 49
                    break
                case "fast":
                    processingPrice = 89
                    break
                case "fastest":
                    processingPrice = 119
                    break
                default:
                    processingPrice = 49 // fallback to standard
            }
        } else {
            // Fallback to domestic standard if no category selected
            processingPrice = 58
        }

        const subtotal = permitTotal + processingPrice
        const taxRate = 0.0775 // 7.75% tax rate for Bellefontaine, OH
        const taxAmount = Math.round(subtotal * taxRate * 100) / 100 // Round to 2 decimal places
        const total = subtotal + taxAmount

        return {
            permitTotal,
            processingPrice,
            subtotal,
            taxAmount,
            total,
            permitCount: formData.selectedPermits?.length || 0,
        }
    }, [formData])

    const totals = calculateTotals()

    useEffect(() => {
        // Debug Framer environment
        // Framer compatibility fixes
        if (
            window.location.href.includes("framer.website") ||
            window.location.href.includes("framercanvas.com")
        ) {
            // Force Stripe Elements to use explicit DOM manipulation
            setTimeout(() => {
                const stripeElements = document.querySelectorAll(
                    '[data-testid*="stripe"], .StripeElement, #payment-element'
                )
                stripeElements.forEach((el) => {
                    if (el) {
                        el.style.visibility = "visible"
                        el.style.opacity = "1"
                        el.style.display = "block"
                    }
                })
            }, 2000)
        }
    }, [])

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!stripe || !elements) {
            setMessage("Payment system not ready. Please wait and try again.")
            return
        }

        setIsProcessing(true)
        setMessage("")

        try {
            // ROLLBACK: Restore lines 571-601 if old billing logic needed
            // Billing details now handled via PaymentElement defaultValues
            const confirmParams = {
                return_url: window.location.href, // Required but won't be used since we handle success here
            }

            // Using the simplified confirmPayment with PaymentElement
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams,
                redirect: "if_required", // Don't redirect, handle success here
            })

            if (error) {
                console.error("Payment error:", error)
                setMessage(error.message)
                onPaymentError(error.message)
            } else {
                // Get payment intent from the client secret
                const paymentIntentId = clientSecret.split("_secret_")[0]
                onPaymentSuccess(paymentIntentId)
            }
        } catch (err) {
            console.error("Payment confirmation failed:", err)
            setMessage("Payment failed. Please try again.")
            onPaymentError(err.message)
        }

        setIsProcessing(false)
    }

    return (
        <div className="payment-form-container">
            <form onSubmit={handleSubmit} className="payment-form">
                {/* Payment Summary - Clean layout without extra boxes */}
                <div className="form-section">
                    <h3 className="form-subtitle">Order Summary</h3>

                    {/* Permits */}
                    <div className="summary-row">
                        <span>
                            {totals.permitCount > 0
                                ? `${totals.permitCount} Permit${totals.permitCount > 1 ? "s" : ""} ($20 each)`
                                : "No permits selected"}
                        </span>
                        <span className="summary-amount">
                            ${totals.permitTotal}.00
                        </span>
                    </div>

                    {/* Processing & Shipping (Combined) */}
                    <div className="summary-row">
                        <span>
                            Processing & Shipping:{" "}
                            {formData.processingOption === "standard"
                                ? "Standard"
                                : formData.processingOption === "fast"
                                  ? "Fast"
                                  : formData.processingOption === "fastest"
                                    ? "Fastest"
                                    : "Standard"}
                        </span>
                        <span className="summary-amount">
                            ${totals.processingPrice}.00
                        </span>
                    </div>

                    {/* Subtotal */}
                    <div className="summary-row subtotal">
                        <span>Subtotal:</span>
                        <span className="summary-amount">
                            ${totals.subtotal.toFixed(2)}
                        </span>
                    </div>

                    {/* Tax */}
                    <div className="summary-row">
                        <span>Tax (7.75%):</span>
                        <span className="summary-amount">
                            ${totals.taxAmount.toFixed(2)}
                        </span>
                    </div>

                    <div className="summary-row total">
                        <span>Total:</span>
                        <span className="summary-amount">
                            ${totals.total.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="form-subtitle">Billing Address</h3>
                    <div className="form-subtext">
                        This address will be used for billing purposes only
                    </div>

                    {/* Same as shipping address checkbox */}
                    <div className="form-group" style={{ marginBottom: "20px" }}>
                        <label style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px", 
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "normal"
                        }}>
                            <input
                                type="checkbox"
                                checked={formData.useSameAsShipping || false}
                                onChange={(e) => {
                                    onFieldChange("useSameAsShipping", e.target.checked);
                                }}
                                style={{ 
                                    width: "18px", 
                                    height: "18px", 
                                    cursor: "pointer",
                                    accentColor: "#007bff"
                                }}
                            />
                            Same as shipping address
                        </label>
                    </div>

                    {/* Conditional billing address fields */}
                    {!formData.useSameAsShipping && (
                        <div className="form-group">
                        <AddressElement
                            options={{
                                mode: "billing",
                                fields: {
                                    phone: "auto",
                                },
                            }}
                            onReady={() => {
                                // AddressElement ready
                            }}
                            onChange={(event) => {
                                if (event.complete) {
                                    // Billing address is complete
                                }
                            }}
                        />
                        </div>
                    )}
                    
                    {/* Show shipping address summary when using same address */}
                    {formData.useSameAsShipping && (
                        <div style={{
                            padding: "16px",
                            backgroundColor: "#f8f9fa",
                            border: "1px solid #dee2e6",
                            borderRadius: "8px",
                            marginBottom: "20px"
                        }}>
                            <div style={{ 
                                fontWeight: "500", 
                                marginBottom: "8px", 
                                color: "#495057",
                                fontSize: "14px"
                            }}>
                                Using shipping address for billing:
                            </div>
                            <div style={{ 
                                fontSize: "14px", 
                                lineHeight: "1.4",
                                color: "#6c757d"
                            }}>
                                {formData.shippingCategory === "international" ? (
                                    <div>
                                        {formData.recipientName && <div><strong>Recipient:</strong> {formData.recipientName}</div>}
                                        {formData.recipientPhone && <div><strong>Phone:</strong> {formData.recipientPhone}</div>}
                                        {formData.shippingCountry && (() => {
                                            try {
                                                const selectedCountry = countries.find(c => c.code === formData.shippingCountry);
                                                return selectedCountry ? (
                                                    <div><strong>Country:</strong> {selectedCountry.flag} {selectedCountry.name}</div>
                                                ) : (
                                                    <div><strong>Country:</strong> {formData.shippingCountry}</div>
                                                );
                                            } catch (error) {
                                                console.error('Error rendering country:', error);
                                                return <div><strong>Country:</strong> {formData.shippingCountry}</div>;
                                            }
                                        })()}
                                        {formData.pcccCode && <div><strong>PCCC Code:</strong> {formData.pcccCode}</div>}
                                        <div><strong>Address:</strong> {formData.internationalFullAddress || "No international address provided"}</div>
                                    </div>
                                ) : formData.shippingStreetAddress ? (
                                    <div>
                                        {formData.recipientName && <div><strong>Recipient:</strong> {formData.recipientName}</div>}
                                        {formData.recipientPhone && <div><strong>Recipient Phone:</strong> {formData.recipientPhone}</div>}
                                        <div>{formData.shippingStreetAddress}</div>
                                        {formData.shippingStreetAddress2 && <div>{formData.shippingStreetAddress2}</div>}
                                        <div>{formData.shippingCity}, {formData.shippingState} {formData.shippingPostalCode}</div>
                                    </div>
                                ) : (
                                    <div style={{ color: "#dc3545", fontStyle: "italic" }}>
                                        No shipping address found. Please complete Step 3 first.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-section">
                    <h3 className="form-subtitle">Payment Information</h3>
                    <div className="form-subtext">
                        Secure payment powered by Stripe
                    </div>

                    {/* Payment Element with billing details pre-filled from Step 3 (ROLLBACK: Remove defaultValues object if needed) */}
                    <div className="form-group">
                        <PaymentElement
                            options={{
                                defaultValues: {
                                    billingDetails: (() => {
                                        // Pre-fill billing details from Step 3 data to reduce redundancy
                                        if (formData.useSameAsShipping) {
                                            // Use shipping address for billing
                                            if (formData.shippingCategory === "international") {
                                                return {
                                                    name: formData.recipientName || "",
                                                    email: formData.email || "",
                                                    phone: formData.recipientPhone || "",
                                                    address: {
                                                        country: formData.shippingCountry || "",
                                                        line1: formData.internationalFullAddress || "",
                                                        line2: "",
                                                        city: "",
                                                        state: "",
                                                        postal_code: formData.pcccCode || "",
                                                    },
                                                };
                                            } else {
                                                // Domestic or military
                                                return {
                                                    name: formData.recipientName || formData.fullName || "",
                                                    email: formData.email || "",
                                                    phone: formData.recipientPhone || formData.phoneNumber || "",
                                                    address: {
                                                        country: "US",
                                                        line1: formData.shippingStreetAddress || "",
                                                        line2: formData.shippingStreetAddress2 || "",
                                                        city: formData.shippingCity || "",
                                                        state: formData.shippingState || "",
                                                        postal_code: formData.shippingPostalCode || "",
                                                    },
                                                };
                                            }
                                        }
                                        // If not using same as shipping, don't pre-fill (user entering different billing)
                                        return {};
                                    })(),
                                },
                                fields: {
                                    billingDetails: {
                                        name: "auto",
                                        email: "auto",
                                        phone: "auto",
                                        address: {
                                            country: "auto",
                                            line1: "auto",
                                            line2: "auto",
                                            city: "auto",
                                            state: "auto",
                                            postalCode: "auto",
                                        },
                                    },
                                },
                                layout: "tabs",
                            }}
                            onReady={() => {
                                setElementReady(true)
                            }}
                            onChange={(event) => {
                                if (event.error) {
                                    setMessage(event.error.message)
                                } else if (event.complete) {
                                    setMessage("")
                                }
                            }}
                        />

                        {!elementReady && (
                            <div className="loading-message">
                                🔄 Loading secure payment form...
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <FormField
                        label="Promo Code"
                        name="promoCode"
                        type="text"
                        placeholder="Enter promo code (optional)"
                        value={formData.promoCode}
                        onChange={onFieldChange}
                        fieldClass=""
                    />
                </div>

                {message && <div className="error-message">{message}</div>}
                <button
                    type="submit"
                    disabled={!stripe || !elements || isProcessing}
                    className="btn primary"
                    style={{ marginTop: "20px" }}
                >
                    {isProcessing ? "Processing..." : "Complete Payment"}
                </button>
            </form>
        </div>
    )
}

// Stripe Elements wrapper component
const StripePaymentWrapper = ({
    clientSecret,
    onPaymentSuccess,
    onPaymentError,
    formData,
    onFieldChange,
}) => {
    const [stripeOptions, setStripeOptions] = useState(null)

    useEffect(() => {
        if (clientSecret) {
            setStripeOptions({
                clientSecret: clientSecret,
                appearance: {
                    theme: "stripe",
                    variables: {
                        colorPrimary: "#0066cc",
                        borderRadius: "8px",
                        fontFamily: "system-ui, sans-serif",
                    },
                },
            })
        }
    }, [clientSecret])

    if (!stripeOptions) {
        return (
            <div className="payment-loading">
                <div className="loading-spinner"></div>
                <p>Initializing payment...</p>
            </div>
        )
    }

    return (
        <div className="payment-container">
            <Elements
                stripe={stripePromise}
                options={stripeOptions}
                key={clientSecret} // Force re-mount when clientSecret changes
            >
                <PaymentForm
                    clientSecret={clientSecret}
                    onPaymentSuccess={onPaymentSuccess}
                    onPaymentError={onPaymentError}
                    formData={formData}
                    onFieldChange={onFieldChange}
                />
            </Elements>
        </div>
    )
}

// Countries array for international shipping and phone number selection
const countries = [
    { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
    { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
    { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
    { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
    { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
    { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
    { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
    { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
    { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
    { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
    { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹" },
    { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
    { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴" },
    { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰" },
    { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮" },
    { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪" },
    { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
    { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷" },
    { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
    { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
    { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
    { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
    { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
    { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
    { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
    { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
    { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
    { code: "PE", name: "Peru", dialCode: "+51", flag: "🇵🇪" },
    { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
    { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
    { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
    { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
    { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺" },
    { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
    { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
    { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
    { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱" },
    { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
    { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
    { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
]

export default function MultistepForm() {
    // Form state with proper validation tracking
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        // Personal info
        email: "",
        phone: "",
        phoneCountryCode: "US", // Default to US
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",

        // License info
        licenseNumber: "",
        licenseState: "",
        licenseExpiration: "",

        // Address info
        streetAddress: "",
        streetAddress2: "",
        city: "",
        state: "",
        zipCode: "",

        // License types
        licenseTypes: [],

        // Other AAA info
        birthplaceCity: "",
        birthplaceState: "",
        driveAbroad: "",
        departureDate: "",
        selectedPermits: [],
        permitEffectiveDate: "",
        signature: "", // Base64 signature data
        termsAgreement: false, // Terms and conditions agreement

        // Step 3 - Processing & Shipping
        processingOption: "",
        shippingCategory: "",
        
        // Shipping address fields
        shippingStreetAddress: "",
        shippingStreetAddress2: "",
        shippingCity: "",
        shippingState: "",
        shippingPostalCode: "",
        shippingCountry: "",
        shippingPhone: "",
        shippingDeliveryInstructions: "",
        
        // International shipping address fields
        internationalFullAddress: "",
        internationalLocalAddress: "",
        internationalDeliveryInstructions: "",
        shippingCountry: "", // Country for international shipping
        pcccCode: "", // PCCC code for Korean customs
        recipientName: "", // Will auto-populate with applicant name
        recipientPhone: "", // International recipient phone number
        
        // Billing address options
        useSameAsShipping: false, // Use shipping address as billing address
        
        // Promo code for payment
        promoCode: "",
    })

    // File upload state for Step 2
    const [uploadedFiles, setUploadedFiles] = useState({
        driversLicense: [],
        passportPhoto: [],
    })

    // Payment state for Step 4
    const [paymentState, setPaymentState] = useState({
        clientSecret: null,
        applicationId: null,
        isLoading: false,
        error: null,
        paymentIntentId: null,
        isComplete: false,
    })

    // Validation errors for all fields
    const [fieldErrors, setFieldErrors] = useState({})
    const [touched, setTouched] = useState({})

    // Track if user manually cleared recipient fields (to prevent auto-refill)
    const [recipientFieldsCleared, setRecipientFieldsCleared] = useState({
        name: false,
        phone: false,
    })

    // Address validation state
    const [addressValidation, setAddressValidation] = useState({
        status: "idle", // 'idle', 'validating', 'valid', 'needs-correction', 'invalid', 'error'
        suggestions: [],
        showSuggestions: false,
        lastValidatedHash: null,
        validatedAddress: null,
        error: null,
        canBypass: false,
        isStandardized: false,
    })

    // Rate limiting and debouncing
    const [validationTimeout, setValidationTimeout] = useState(null)
    const [rateLimitState, setRateLimitState] = useState({
        requestCount: 0,
        lastReset: Date.now(),
        isBlocked: false,
        blockUntil: null,
    })

    // Shipping address data from custom fields
    const [shippingAddress, setShippingAddress] = useState({
        country: null,
        isComplete: false,
        address: null
    })

    // Shipping address validation state
    const [shippingValidation, setShippingValidation] = useState({
        status: null, // "validating", "valid", "invalid", "error", "needs-correction"
        error: null,
        suggestions: [],
        showSuggestions: false,
        validatedAddress: null,
        canBypass: false
    })

    // Military address validation helpers
    const isValidMilitaryCity = (city) => {
        const validMilitaryCities = ['APO', 'FPO', 'DPO']
        return validMilitaryCities.includes(city.toUpperCase().trim())
    }

    const isValidMilitaryState = (state) => {
        const validMilitaryStates = ['AA', 'AE', 'AP']
        return validMilitaryStates.includes(state.toUpperCase().trim())
    }

    // Validation rules
    const validationRules = useMemo(
        () => ({
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address",
            },
            phone: {
                required: true,
                pattern: /^[\d\s\(\)\-\+]{7,20}$/,
                message: "Please enter a valid phone number",
            },
            firstName: {
                required: true,
                minLength: 1,
                message: "First name is required",
            },
            lastName: {
                required: true,
                minLength: 1,
                message: "Last name is required",
            },
            dateOfBirth: {
                required: true,
                validate: (value) => {
                    if (!value) return false
                    const birthDate = new Date(value)
                    const today = new Date()
                    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
                    const oneHundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
                    
                    // Must be at least 18 years old and not older than 100 years
                    return birthDate <= eighteenYearsAgo && birthDate >= oneHundredYearsAgo
                },
                message: (value) => {
                    if (!value) return "Date of birth is required"
                    const birthDate = new Date(value)
                    const today = new Date()
                    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
                    const oneHundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
                    
                    if (birthDate > eighteenYearsAgo) {
                        return "You must be at least 18 years old"
                    }
                    if (birthDate < oneHundredYearsAgo) {
                        return "Please verify your date of birth - age cannot exceed 100 years"
                    }
                    return "Please enter a valid date of birth"
                },
            },
            licenseNumber: {
                required: true,
                minLength: 5,
                message: "Please enter a valid license number",
            },
            licenseState: {
                required: true,
                pattern: /^[A-Z]{2}$/,
                message: "Please enter a valid 2-letter state code",
            },
            licenseExpiration: {
                required: true,
                validate: (value) => {
                    if (!value) return false
                    const selectedDate = new Date(value)
                    const today = new Date()
                    const year2070 = new Date(2070, 11, 31) // December 31, 2070
                    
                    // License must not be expired (must be valid today or in the future)
                    // and cannot be beyond year 2070
                    return selectedDate >= today && selectedDate <= year2070
                },
                message: "License must not be expired and cannot exceed year 2070",
            },
            streetAddress: {
                required: true,
                minLength: 5,
                message: "Please enter a complete street address",
            },
            city: {
                required: true,
                minLength: 2,
                message: "Please enter a valid city",
            },
            state: {
                required: true,
                validate: (value) => {
                    if (!value || value === "") return false
                    return [
                        "AL",
                        "AK",
                        "AZ",
                        "AR",
                        "CA",
                        "CO",
                        "CT",
                        "DE",
                        "DC",
                        "FL",
                        "GA",
                        "HI",
                        "ID",
                        "IL",
                        "IN",
                        "IA",
                        "KS",
                        "KY",
                        "LA",
                        "ME",
                        "MD",
                        "MA",
                        "MI",
                        "MN",
                        "MS",
                        "MO",
                        "MT",
                        "NE",
                        "NV",
                        "NH",
                        "NJ",
                        "NM",
                        "NY",
                        "NC",
                        "ND",
                        "OH",
                        "OK",
                        "OR",
                        "PA",
                        "RI",
                        "SC",
                        "SD",
                        "TN",
                        "TX",
                        "UT",
                        "VT",
                        "VA",
                        "WA",
                        "WV",
                        "WI",
                        "WY",
                    ].includes(value)
                },
                message: "Please select a valid state",
            },
            zipCode: {
                required: true,
                validate: (value) => {
                    return /^\d{5}(-\d{4})?$/.test(value)
                },
                message: "Please enter a valid ZIP code",
            },
            licenseTypes: {
                required: true,
                validate: (value) => value && value.length > 0,
                message: "Please select at least one license type",
            },
            birthplaceCity: {
                required: true,
                minLength: 2,
                message: "Birthplace city is required",
            },
            birthplaceState: {
                required: true,
                minLength: 2,
                message: "Birthplace state is required",
            },
            driveAbroad: {
                required: true,
                message: "Please select where you will drive abroad",
            },
            departureDate: {
                required: true,
                message: "Departure date is required",
            },
            selectedPermits: {
                required: true,
                validate: (value) => value && value.length > 0,
                message: "Please select at least one permit",
            },
            permitEffectiveDate: {
                required: true,
                validate: (value) => {
                    if (!value) return false
                    
                    // Parse the date string as local time to avoid timezone issues
                    const dateParts = value.split('-') // "2025-11-08" -> ["2025", "11", "08"]
                    const selectedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
                    
                    const today = new Date()
                    const sixMonthsFromNow = new Date()
                    sixMonthsFromNow.setMonth(today.getMonth() + 6)
                    
                    // Set time to start of day for accurate date comparison (ignore time)
                    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    const sixMonthsEnd = new Date(sixMonthsFromNow.getFullYear(), sixMonthsFromNow.getMonth(), sixMonthsFromNow.getDate())
                    
                    // Allow dates from today (inclusive) up to 6 months in the future
                    return selectedDate >= todayStart && selectedDate <= sixMonthsEnd
                },
                message: "Permit effective date must be between today and 6 months from now",
            },
            signature: {
                required: true,
                message: "Digital signature is required",
            },
            termsAgreement: {
                required: true,
                validate: (value) => value === true,
                message: "You must agree to the terms and conditions",
            },
            processingOption: {
                required: true,
                message: "Please select a processing speed",
            },
            shippingCategory: {
                required: true,
                message: "Please select a shipping category",
            },
            shippingCountry: {
                required: true,
                message: "Please select a country",
            },
            pcccCode: {
                required: true,
                minLength: 4,
                message: "Please enter a valid PCCC code",
            },
            internationalFullAddress: {
                required: true,
                minLength: 10,
                message: "Please provide a complete address including street, city, state/province, postal code, and country",
            },
            recipientName: {
                required: true,
                minLength: 2,
                message: "Please enter the recipient's full name",
            },
            recipientPhone: {
                required: true,
                minLength: 7,
                message: "Please enter a valid phone number with country code",
            },
            shippingStreetAddress: {
                required: true,
                minLength: 5,
                message: "Please enter a complete street address",
            },
            shippingCity: {
                required: true,
                validate: (value) => {
                    if (!value || value.trim().length < 2) return false
                    
                    // If military shipping category, only allow military cities
                    if (formData.shippingCategory === 'military') {
                        return isValidMilitaryCity(value)
                    }
                    
                    return true
                },
                message: (value) => {
                    if (formData.shippingCategory === 'military') {
                        return "Military addresses must use APO, FPO, or DPO as the city"
                    }
                    return "Please enter a valid city"
                }
            },
            shippingState: {
                required: true,
                validate: (value) => {
                    if (!value || value.trim().length < 2) return false
                    
                    // If military shipping category, only allow military states
                    if (formData.shippingCategory === 'military') {
                        return isValidMilitaryState(value)
                    }
                    
                    return true
                },
                message: (value) => {
                    if (formData.shippingCategory === 'military') {
                        return "Military addresses must use AA, AE, or AP as the state"
                    }
                    return "Please enter a valid state/province"
                }
            },
            shippingPostalCode: {
                required: true,
                minLength: 3,
                message: "Please enter a valid postal/ZIP code",
            },
            shippingCountry: {
                required: true,
                message: "Please select a country",
            },
        }),
        []
    )

    // Field validation function
    const validateField = useCallback(
        (name, value, allData) => {
            const rule = validationRules[name]
            if (!rule) return null

            // Required check - special handling for booleans
            if (rule.required) {
                if (typeof value === "boolean") {
                    if (!value) {
                        return typeof rule.message === "function" ? rule.message(value) : (rule.message || `${name} is required`)
                    }
                } else if (!value || value.toString().trim() === "") {
                    return typeof rule.message === "function" ? rule.message(value) : (rule.message || `${name} is required`)
                }
            }

            // Skip other validations if empty and not required
            if (!value) return null

            // Custom validation - pass the original value for booleans
            if (rule.validate) {
                if (typeof value === "boolean") {
                    if (!rule.validate(value)) {
                        return typeof rule.message === "function" ? rule.message(value) : rule.message
                    }
                } else {
                    const trimmedValue = value.toString().trim()
                    if (!rule.validate(trimmedValue)) {
                        return typeof rule.message === "function" ? rule.message(value) : rule.message
                    }
                }
            }

            // For non-boolean values, continue with string-based validations
            if (typeof value !== "boolean") {
                const trimmedValue = value.toString().trim()

                // Pattern check
                if (rule.pattern && !rule.pattern.test(trimmedValue)) {
                    return rule.message
                }

                // Min length check
                if (rule.minLength && trimmedValue.length < rule.minLength) {
                    return rule.message
                }
            }

            return null
        },
        [validationRules]
    )

    // Get validation CSS class
    const getFieldClass = useCallback(
        (fieldName) => {
            const hasError = fieldErrors[fieldName] && touched[fieldName]
            const isValid =
                !fieldErrors[fieldName] &&
                touched[fieldName] &&
                formData[fieldName]

            if (hasError) return "field-error"
            if (isValid) return "field-valid"
            return ""
        },
        [fieldErrors, touched, formData]
    )

    // Address validation CSS class
    const getAddressValidationClass = useCallback(() => {
        switch (addressValidation.status) {
            case "validating":
                return "validation-pending"
            case "valid":
                return "validation-success"
            case "needs-correction":
                return "validation-warning"
            case "invalid":
            case "error":
                return "validation-error"
            default:
                return ""
        }
    }, [addressValidation.status])

    // Generate address hash for comparison (excluding apartment since we don't validate it)
    const getAddressHash = useCallback((addressData) => {
        return `${addressData.streetAddress}|${addressData.city}|${addressData.state}|${addressData.zipCode}`.toLowerCase()
    }, [])

    // Check if address has minimum required fields
    const hasMinimumAddressFields = useCallback((addressData) => {
        const required = ["streetAddress", "city", "state", "zipCode"]
        return required.every((field) => {
            const value = addressData[field]?.trim()
            if (!value) return false

            // Basic format validation
            if (field === "zipCode") {
                return /^\d{5}(-\d{4})?$/.test(value)
            }
            if (field === "state") {
                return value.length >= 2
            }
            return value.length >= 1
        })
    }, [])

    // Set viewport meta tag for proper mobile rendering
    useEffect(() => {
        const setViewportMeta = () => {
            // Check if viewport meta tag already exists
            let viewport = document.querySelector('meta[name="viewport"]')
            
            if (!viewport) {
                // Create new viewport meta tag
                viewport = document.createElement('meta')
                viewport.name = 'viewport'
                document.head.appendChild(viewport)
            }
            
            // Set the content for mobile optimization
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        }
        
        setViewportMeta()
    }, [])

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (validationTimeout) {
                clearTimeout(validationTimeout)
            }
        }
    }, [validationTimeout])

    // Rate limiting management
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            setRateLimitState((prev) => {
                if (now - prev.lastReset > 60000) {
                    return {
                        requestCount: 0,
                        lastReset: now,
                        isBlocked: false,
                        blockUntil: null,
                    }
                }
                if (
                    prev.isBlocked &&
                    prev.blockUntil &&
                    now > prev.blockUntil
                ) {
                    return {
                        ...prev,
                        isBlocked: false,
                        blockUntil: null,
                    }
                }
                return prev
            })
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    // Reset processing speed when category changes
    useEffect(() => {
        if (formData.shippingCategory) {
            setFormData((prev) => ({
                ...prev,
                processingOption: "", // Clear speed selection when category changes
            }))
        }
    }, [formData.shippingCategory])

    // Auto-fill recipient fields when reaching step 3
    useEffect(() => {
        if (step === 3) {
            setFormData((prev) => {
                const updates = {}
                
                // Auto-fill recipient name if empty, applicant name exists, AND user hasn't manually cleared it
                if (!prev.recipientName && prev.firstName && prev.lastName && !recipientFieldsCleared.name) {
                    updates.recipientName = `${prev.firstName} ${prev.lastName}`.trim()
                }
                
                // Auto-fill recipient phone if empty, applicant phone exists, AND user hasn't manually cleared it
                if (!prev.recipientPhone && prev.phone && !recipientFieldsCleared.phone) {
                    updates.recipientPhone = prev.phone
                }
                
                // Only update if there are changes to make
                if (Object.keys(updates).length > 0) {
                    return { ...prev, ...updates }
                }
                
                return prev
            })
        }
    }, [step, formData.firstName, formData.lastName, formData.phone, formData.recipientName, formData.recipientPhone, recipientFieldsCleared])

    // Reset recipient cleared flags if user changes their personal info in Step 1
    useEffect(() => {
        // If user modified their name or phone, allow auto-fill to work again
        if (recipientFieldsCleared.name || recipientFieldsCleared.phone) {
            setRecipientFieldsCleared({ name: false, phone: false })
        }
    }, [formData.firstName, formData.lastName, formData.phone])

    // Address validation function
    const validateAddress = useCallback(
        async (addressData) => {
            const addressHash = getAddressHash(addressData)

            // Skip if already validated this exact address
            if (
                addressValidation.lastValidatedHash === addressHash &&
                addressValidation.status === "valid"
            ) {
                return
            }

            // Check rate limiting
            if (rateLimitState.isBlocked) {
                const timeLeft = Math.ceil(
                    (rateLimitState.blockUntil - Date.now()) / 1000
                )
                setAddressValidation((prev) => ({
                    ...prev,
                    status: "error",
                    error: `Rate limit exceeded. Please wait ${timeLeft} seconds.`,
                    showSuggestions: false,
                }))
                return
            }

            if (rateLimitState.requestCount >= 10) {
                setRateLimitState((prev) => ({
                    ...prev,
                    isBlocked: true,
                    blockUntil: Date.now() + 30000,
                }))
                setAddressValidation((prev) => ({
                    ...prev,
                    status: "error",
                    error: "Too many requests. Please wait 30 seconds.",
                    showSuggestions: false,
                }))
                return
            }

            // Update request count
            setRateLimitState((prev) => ({
                ...prev,
                requestCount: prev.requestCount + 1,
            }))

            setAddressValidation((prev) => ({
                ...prev,
                status: "validating",
                error: null,
                showSuggestions: false,
            }))

            try {
                const response = await fetch(
                    "https://easypost-api.vercel.app/api/validate-address",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            street1: addressData.streetAddress,
                            // Note: street2 (apartment) intentionally omitted - we only validate base address
                            city: addressData.city,
                            state: addressData.state,
                            zip: addressData.zipCode,
                            country: "US",
                        }),
                    }
                )

                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || "Validation failed")
                }

                const isDeliverable = result.deliverable && !result.zipMismatch
                const hasStandardization = result.suggestions?.length > 0

                // Check if there are significant differences between input and EasyPost's response
                // This catches cases where user typed obvious errors but EasyPost corrected them
                const hasSignificantChanges =
                    hasStandardization &&
                    result.suggestions.some((suggestion) => {
                        const normalizeForComparison = (str) =>
                            str.toLowerCase().replace(/\s+/g, " ").trim()

                        // Check for significant differences in street address
                        const originalStreet = normalizeForComparison(
                            addressData.streetAddress
                        )
                        const suggestedStreet = normalizeForComparison(
                            suggestion.street1
                        )

                        // Check for ZIP code differences (these are always significant)
                        const originalZip = addressData.zipCode.trim()
                        const suggestedZip = suggestion.zip.split("-")[0] // Compare base ZIP only
                        const zipChanged = originalZip !== suggestedZip

                        // If EasyPost changed the street address at all, treat it as needing correction
                        // This includes abbreviation changes like "Drive" → "DR"
                        const streetChanged = originalStreet !== suggestedStreet

                        // Check for city/state changes (these are always significant)
                        const cityChanged =
                            normalizeForComparison(suggestion.city) !==
                            normalizeForComparison(addressData.city)
                        const stateChanged =
                            suggestion.state.toLowerCase() !==
                            addressData.state.toLowerCase()

                        return (
                            streetChanged ||
                            zipChanged ||
                            cityChanged ||
                            stateChanged
                        )
                    })

                // Check if user entered apartment but EasyPost suggests address without apartment
                // This indicates the apartment number doesn't exist at that address
                const userEnteredApartment = addressData.streetAddress2?.trim()
                const apartmentMismatch =
                    userEnteredApartment &&
                    hasStandardization &&
                    result.suggestions.some((suggestion) => !suggestion.street2)

                // Logic:
                // - Valid: deliverable and no significant changes and no apartment mismatch
                // - Needs correction: deliverable but has significant changes OR apartment doesn't exist
                const isValid =
                    isDeliverable &&
                    !hasSignificantChanges &&
                    !apartmentMismatch
                const needsCorrection =
                    isDeliverable &&
                    (hasSignificantChanges || apartmentMismatch)
                const shouldShowSuggestions = hasStandardization // Always show if EasyPost has suggestions

                setAddressValidation({
                    status: isValid
                        ? "valid"
                        : needsCorrection
                          ? "needs-correction"
                          : "invalid",
                    suggestions: result.suggestions || [],
                    showSuggestions: shouldShowSuggestions,
                    lastValidatedHash: addressHash,
                    validatedAddress: result.verifiedAddress,
                    error: result.zipMismatch
                        ? `ZIP code doesn't match ${result.verifiedAddress.city}, ${result.verifiedAddress.state}`
                        : !isDeliverable
                          ? "Address could not be validated"
                          : null,
                    canBypass: !result.deliverable || result.zipMismatch,
                    isStandardized: hasStandardization && isDeliverable,
                })
            } catch (error) {
                console.error("Address validation error:", error)

                let errorMessage = "Address validation failed"
                let canBypass = true

                if (
                    error.message.includes("rate-limit") ||
                    error.message.includes("Rate limit")
                ) {
                    errorMessage =
                        "Validation temporarily unavailable due to high usage. Please wait a moment."
                    canBypass = false
                } else if (
                    error.message.includes("network") ||
                    error.message.includes("fetch")
                ) {
                    errorMessage =
                        "Network error. Please check your connection and try again."
                } else if (error.message.includes("timeout")) {
                    errorMessage =
                        "Validation request timed out. Please try again."
                    canBypass = false
                } else if (error.message.includes("INVALID_PARAMETER")) {
                    errorMessage =
                        "Invalid address format. Please check your address and try again."
                } else if (
                    error.message.includes("404") ||
                    error.message.includes("Not Found")
                ) {
                    errorMessage =
                        "Address validation service temporarily unavailable."
                }

                setAddressValidation((prev) => ({
                    ...prev,
                    status: "error",
                    error: errorMessage,
                    showSuggestions: false,
                    canBypass,
                }))
            }
        },
        [
            getAddressHash,
            rateLimitState,
            addressValidation.lastValidatedHash,
            addressValidation.status,
        ]
    )

    // Validate shipping address for domestic/military addresses
    const validateShippingAddress = useCallback(async () => {
        const shippingData = {
            streetAddress: formData.shippingStreetAddress,
            city: formData.shippingCity,
            state: formData.shippingState,
            zipCode: formData.shippingPostalCode
        }

        // Only validate if we have required fields and it's domestic/military
        if (!shippingData.streetAddress || !shippingData.city || !shippingData.state || !shippingData.zipCode) {
            return
        }

        if (formData.shippingCategory === "international") {
            return
        }

        setShippingValidation(prev => ({ ...prev, status: "validating", error: null }))

        try {
            const response = await fetch(
                "https://easypost-api.vercel.app/api/validate-address",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        street1: shippingData.streetAddress,
                        city: shippingData.city,
                        state: shippingData.state,
                        zip: shippingData.zipCode,
                        country: "US",
                    }),
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Validation failed")
            }

            const isDeliverable = result.deliverable && !result.zipMismatch
            const hasStandardization = result.suggestions?.length > 0

            // Check if there are significant differences between input and EasyPost's response
            const hasSignificantChanges = result.suggestions?.some(suggestion => 
                suggestion.street1?.toLowerCase() !== shippingData.streetAddress?.toLowerCase() ||
                suggestion.city?.toLowerCase() !== shippingData.city?.toLowerCase() ||
                suggestion.state?.toLowerCase() !== shippingData.state?.toLowerCase() ||
                suggestion.zip !== shippingData.zipCode
            ) || false

            const isValid = isDeliverable && !hasSignificantChanges
            const needsCorrection = isDeliverable && hasSignificantChanges
            const shouldShowSuggestions = hasStandardization

            setShippingValidation({
                status: isValid ? "valid" : needsCorrection ? "needs-correction" : "invalid",
                error: !isDeliverable ? "Address could not be validated. You can still continue with your application." : null,
                suggestions: result.suggestions || [],
                showSuggestions: shouldShowSuggestions,
                validatedAddress: result.address,
                canBypass: !isDeliverable
            })

        } catch (error) {
            let errorMessage = "Address validation failed. You can still continue with your application."
            const canBypass = true

            if (error.message.includes("TIMEOUT")) {
                errorMessage = "Address validation timed out. You can still continue with your application."
            } else if (error.message.includes("INVALID_PARAMETER")) {
                errorMessage = "Invalid address format. Please check your address and try again."
            } else if (error.message.includes("404") || error.message.includes("Not Found")) {
                errorMessage = "Address validation service temporarily unavailable."
            }

            setShippingValidation({
                status: "error",
                error: errorMessage,
                suggestions: [],
                showSuggestions: false,
                validatedAddress: null,
                canBypass
            })
        }
    }, [formData.shippingStreetAddress, formData.shippingCity, formData.shippingState, formData.shippingPostalCode, formData.shippingCategory])

    // Debounced shipping address validation
    useEffect(() => {
        if (formData.shippingCategory && formData.shippingCategory !== "international") {
            const timer = setTimeout(() => {
                validateShippingAddress()
            }, 800) // 800ms delay after user stops typing
            
            return () => clearTimeout(timer)
        }
    }, [validateShippingAddress, formData.shippingCategory])

    // Handle form field changes
    const handleFieldChange = useCallback(
        (name, value, event) => {
            // Handle checkbox arrays for licenseTypes and selectedPermits
            if (name === "licenseTypes" || name === "selectedPermits") {
                const isChecked = event ? event.target.checked : false
                setFormData((prev) => {
                    const currentArray = prev[name] || []
                    let newArray

                    if (isChecked) {
                        newArray = [...currentArray, value]
                    } else {
                        newArray = currentArray.filter((item) => item !== value)
                    }

                    const newFormData = { ...prev, [name]: newArray }

                    // Only validate, don't mark as touched yet
                    const error = validateField(name, newArray, newFormData)
                    setFieldErrors((prevErrors) => ({
                        ...prevErrors,
                        [name]: error,
                    }))

                    return newFormData
                })
            } else {
                // Handle regular fields
                setFormData((prev) => {
                    const newFormData = { ...prev, [name]: value }

                    // Track if user manually cleared recipient fields
                    if (name === "recipientName" && value === "" && prev.recipientName !== "") {
                        setRecipientFieldsCleared((p) => ({ ...p, name: true }))
                    }
                    if (name === "recipientPhone" && value === "" && prev.recipientPhone !== "") {
                        setRecipientFieldsCleared((p) => ({ ...p, phone: true }))
                    }

                    // Skip real-time validation for phone field to prevent red border while typing
                    if (name !== "phone" && name !== "shippingPhone") {
                        // Only validate, don't mark as touched yet
                        const error = validateField(name, value, newFormData)
                        setFieldErrors((prevErrors) => ({
                            ...prevErrors,
                            [name]: error,
                        }))
                    }

                    return newFormData
                })
            }
            // Don't mark as touched here - only on blur
        },
        [validateField]
    )

    // Handle address field changes with validation
    const handleAddressChange = useCallback(
        (field, value) => {
            setFormData((prev) => {
                const newFormData = { ...prev, [field]: value }

                // Validate the specific field
                const error = validateField(field, value, newFormData)
                setFieldErrors((prevErrors) => ({
                    ...prevErrors,
                    [field]: error,
                }))

                // Clear existing timeout
                if (validationTimeout) {
                    clearTimeout(validationTimeout)
                }

                // Reset address validation if currently valid/invalid
                if (
                    ["valid", "invalid", "error", "needs-correction"].includes(
                        addressValidation.status
                    )
                ) {
                    setAddressValidation((prev) => ({
                        ...prev,
                        status: "idle",
                        error: null,
                        showSuggestions: false,
                    }))
                }

                // Trigger address validation if minimum fields are met
                if (hasMinimumAddressFields(newFormData)) {
                    const delay =
                        1200 + Math.min(rateLimitState.requestCount * 200, 800)
                    const timeoutId = setTimeout(() => {
                        validateAddress(newFormData)
                    }, delay)
                    setValidationTimeout(timeoutId)
                }

                return newFormData
            })

            setTouched((prev) => ({ ...prev, [field]: true }))
        },
        [
            validateField,
            validationTimeout,
            addressValidation.status,
            hasMinimumAddressFields,
            rateLimitState.requestCount,
            validateAddress,
        ]
    )

    // Handle field blur for validation
    const handleBlur = useCallback(
        (name) => {
            setTouched((prev) => ({ ...prev, [name]: true }))

            // Validate field on blur if not already validated
            const error = validateField(name, formData[name], formData)
            setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: error }))
        },
        [validateField, formData]
    )

    // Accept suggested address
    const acceptSuggestion = useCallback(
        (suggestion) => {
            setFormData((prev) => {
                const newFormData = {
                    ...prev,
                    streetAddress: suggestion.street1,
                    streetAddress2: suggestion.street2 || "", // Use what EasyPost provides
                    city: suggestion.city,
                    state: suggestion.state,
                    zipCode: suggestion.zip,
                }

                setAddressValidation((prevValidation) => ({
                    ...prevValidation,
                    status: "valid",
                    showSuggestions: false,
                    validatedAddress: suggestion,
                    lastValidatedHash: getAddressHash(newFormData),
                }))

                return newFormData
            })
        },
        [getAddressHash]
    )

    // Accept shipping address suggestion
    const acceptShippingSuggestion = useCallback(
        (suggestion) => {
            setFormData((prev) => ({
                ...prev,
                shippingStreetAddress: suggestion.street1,
                shippingStreetAddress2: suggestion.street2 || "",
                shippingCity: suggestion.city,
                shippingState: suggestion.state,
                shippingPostalCode: suggestion.zip,
            }))

            setShippingValidation((prev) => ({
                ...prev,
                status: "valid",
                showSuggestions: false,
                validatedAddress: suggestion,
            }))
        },
        []
    )

    // Form validation for step progression
    const validateStep = useCallback(
        (stepNumber) => {
            const fieldsForStep = {
                1: [
                    "email",
                    "phone",
                    "firstName",
                    "lastName",
                    "dateOfBirth",
                    "licenseNumber",
                    "licenseState",
                    "licenseExpiration",
                    "streetAddress",
                    "city",
                    "state",
                    "zipCode",
                    "birthplaceCity",
                    "birthplaceState",
                    "driveAbroad",
                    "departureDate",
                    "licenseTypes",
                    "selectedPermits",
                    "permitEffectiveDate",
                    "signature",
                    "termsAgreement",
                ],
                3: ["processingOption", "shippingCategory"],
            }

            // Add conditional fields for Step 3
            if (stepNumber === 3) {
                // Add shipping address fields (only for domestic and military, not international)
                if (formData.shippingCategory && formData.shippingCategory !== "international") {
                    fieldsForStep[3] = [
                        ...fieldsForStep[3], 
                        "recipientName",
                        "recipientPhone",
                        "shippingStreetAddress", 
                        "shippingCity", 
                        "shippingState", 
                        "shippingPostalCode"
                    ]
                }
                
                // If international shipping is selected, add conditional fields
                if (formData.shippingCategory === "international") {
                    fieldsForStep[3] = [
                        ...fieldsForStep[3], 
                        "shippingCountry",
                        "internationalFullAddress",
                        "recipientName",
                        "recipientPhone"
                    ]
                    
                    // Add PCCC field if South Korea is selected
                    if (formData.shippingCountry === "KR") {
                        fieldsForStep[3].push("pcccCode")
                    }
                }
            }

            const fields = fieldsForStep[stepNumber] || []
            const errors = {}

            // Get current form data
            setFormData((currentFormData) => {
                fields.forEach((field) => {
                    const error = validateField(
                        field,
                        currentFormData[field],
                        currentFormData
                    )
                    if (error) errors[field] = error
                })

                // Mark all fields as touched for this step
                const touchedFields = {}
                fields.forEach((field) => (touchedFields[field] = true))
                setTouched((prev) => ({ ...prev, ...touchedFields }))
                setFieldErrors((prev) => ({ ...prev, ...errors }))

                return currentFormData
            })

            // Check address validation for step 1 - now informational only
            // Address validation no longer blocks progression
            // Users can continue regardless of validation status

            // Check file uploads for step 2
            if (stepNumber === 2) {
                if (uploadedFiles.driversLicense.length === 0) {
                    errors.driversLicense =
                        "Please upload at least one driver's license image"
                }
                if (uploadedFiles.passportPhoto.length === 0) {
                    errors.passportPhoto =
                        "Please upload at least one passport-style photo"
                }
            }

            return errors
        },
        [validateField, addressValidation.status, uploadedFiles]
    )

    // File upload handlers
    const handleFileUpload = useCallback(async (files, uploadType) => {
        // Convert HEIC files to JPG for universal compatibility
        const convertedFiles = await Promise.all(
            Array.from(files).map(async (file) => {
                if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
                    try {
                        const convertedBlob = await heic2any({
                            blob: file,
                            toType: "image/jpeg",
                            quality: 0.9
                        })
                        return new File(
                            [convertedBlob],
                            file.name.replace(/\.(heic|heif)$/i, ".jpg"),
                            { type: "image/jpeg" }
                        )
                    } catch (error) {
                        console.error("HEIC conversion failed:", error)
                        alert(`Failed to convert ${file.name}. Please try a different file.`)
                        return null
                    }
                }
                return file
            })
        )

        const validFiles = convertedFiles.filter(file => file !== null).filter((file) => {
            // Accept common image formats, HEIC (iPhone photos), and PDF
            const validTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
                "image/heic",
                "image/heif",
                "application/pdf",
            ]
            const maxSize = 10 * 1024 * 1024 // 10MB max

            if (!validTypes.includes(file.type)) {
                alert(
                    `Invalid file type: ${file.name}. Please upload JPG, PNG, GIF, WebP, HEIC (iPhone photos), or PDF files.`
                )
                return false
            }

            if (file.size > maxSize) {
                alert(`File too large: ${file.name}. Maximum size is 10MB.`)
                return false
            }

            return true
        })

        if (validFiles.length > 0) {
            setUploadedFiles((prev) => ({
                ...prev,
                [uploadType]: [...prev[uploadType], ...validFiles],
            }))
        }
    }, [])

    const removeFile = useCallback((uploadType, index) => {
        setUploadedFiles((prev) => ({
            ...prev,
            [uploadType]: prev[uploadType].filter((_, i) => i !== index),
        }))
    }, [])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
        (e, uploadType) => {
            e.preventDefault()
            e.stopPropagation()
            const files = e.dataTransfer.files
            handleFileUpload(files, uploadType)
        },
        [handleFileUpload]
    )

    // Payment setup function for Step 4
    const setupPayment = useCallback(async () => {
        setPaymentState((prev) => ({ ...prev, isLoading: true, error: null }))

        try {
            // ROLLBACK: Remove validation block if causing issues
            // Validate required Step 3 fields before proceeding with payment
            const requiredStep3Fields = {
                processingOption: "Please select a processing speed in Step 3",
                shippingCategory: "Please select a shipping category in Step 3"
            }
            
            for (const [field, errorMsg] of Object.entries(requiredStep3Fields)) {
                if (!formData[field] || formData[field].trim() === "") {
                    setPaymentState((prev) => ({ 
                        ...prev, 
                        isLoading: false, 
                        error: errorMsg 
                    }))
                    // Go back to Step 3 to fix the issue
                    setStep(3)
                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: "smooth" })
                    }, 100)
                    return
                }
            }
            
            console.log("Starting payment setup...")
            console.log("Form data:", formData)
            console.log("Uploaded files:", uploadedFiles)

            // Convert files to base64 for transmission (same as old checkout handler)
            const convertFilesToBase64 = async (files) => {
                const filePromises = files.map((file) => {
                    return new Promise((resolve) => {
                        const reader = new FileReader()
                        reader.onload = () => {
                            resolve({
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: reader.result, // This includes the data:image/jpeg;base64, prefix
                            })
                        }
                        reader.readAsDataURL(file)
                    })
                })
                return Promise.all(filePromises)
            }

            const fileData = {
                driversLicense: await convertFilesToBase64(
                    uploadedFiles.driversLicense
                ),
                passportPhoto: await convertFilesToBase64(
                    uploadedFiles.passportPhoto
                ),
            }

            console.log("Saving application...")
            
            // Add shipping country to formData for fulfillment type determination
            const formDataWithShipping = {
                ...formData,
                // Use the shipping country from our custom fields, or fall back to shippingAddress state
                shippingCountry: formData.shippingCountry || shippingAddress.country || null
            }
            
            const saveResponse = await fetch(
                "https://easypost-api.vercel.app/api/save-application",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ formData: formDataWithShipping, fileData }),
                }
            )

            if (!saveResponse.ok) {
                const errorText = await saveResponse.text()
                console.error("Save application failed:", errorText)
                throw new Error("Failed to save application")
            }

            const { applicationId } = await saveResponse.json()
            console.log("Application saved with ID:", applicationId)

            // Create payment intent
            console.log("Creating payment intent...")
            const paymentResponse = await fetch(
                "https://easypost-api.vercel.app/api/create-payment-intent",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ applicationId, formData }),
                }
            )

            if (!paymentResponse.ok) {
                const errorText = await paymentResponse.text()
                console.error("Create payment intent failed:", {
                    status: paymentResponse.status,
                    statusText: paymentResponse.statusText,
                    errorText,
                })

                // If the API endpoint doesn't exist yet, fall back to redirect checkout
                if (paymentResponse.status === 404) {
                    console.log(
                        "Payment intent API not available, falling back to redirect checkout..."
                    )

                    const checkoutResponse = await fetch(
                        "https://easypost-api.vercel.app/api/create-checkout",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ applicationId, formData }),
                        }
                    )

                    if (checkoutResponse.ok) {
                        const checkoutData = await checkoutResponse.json()
                        if (checkoutData.checkoutUrl) {
                            window.location.href = checkoutData.checkoutUrl
                            return
                        }
                    }
                }

                throw new Error(
                    `Failed to create payment intent (${paymentResponse.status}): ${errorText}`
                )
            }

            const { clientSecret } = await paymentResponse.json()
            console.log("Payment intent created successfully")

            setPaymentState((prev) => ({
                ...prev,
                clientSecret,
                applicationId,
                isLoading: false,
            }))
        } catch (error) {
            console.error("Payment setup error:", error)
            setPaymentState((prev) => ({
                ...prev,
                error: error.message,
                isLoading: false,
            }))
        }
    }, [formData, uploadedFiles])

    // Payment success handler
    const handlePaymentSuccess = useCallback(
        async (paymentIntentId) => {
            console.log("Payment successful, updating database...", {
                paymentIntentId,
                applicationId: paymentState.applicationId,
            })

            // Only proceed if this is the first time we're handling this payment
            if (paymentState.isComplete) {
                console.log("Payment already processed, skipping")
                return
            }

            try {
                // Stripe webhook will handle the database update and Make.com trigger automatically
                // No need for manual webhook call since Stripe webhooks are now working
                console.log("Payment successful - Stripe webhook will handle automation")
            } catch (error) {
                console.error("Error in payment success handler:", error)
            }

            setPaymentState((prev) => ({
                ...prev,
                paymentIntentId,
                isComplete: true,
            }))
        },
        [paymentState.applicationId, paymentState.isComplete]
    )

    // Payment error handler
    const handlePaymentError = useCallback((error) => {
        setPaymentState((prev) => ({
            ...prev,
            error,
        }))
    }, [])

    // Navigation handlers
    const handleNext = useCallback(() => {
        const errors = validateStep(step)

        if (Object.keys(errors).length === 0) {
            if (step === 3) {
                // Moving from Step 3 to Step 4 (Payment)
                setStep(4)
                setupPayment() // Setup payment when entering Step 4
            } else {
                setStep((prev) => Math.min(prev + 1, 4))
            }
            // Scroll to top of the form when advancing to next step
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: "smooth" })
            }, 100)
        } else {
            // Scroll to first error
            setTimeout(() => {
                const firstErrorField = document.querySelector(".field-error")
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    })
                }
            }, 100)
        }
    }, [step, validateStep, setupPayment])

    const handleBack = useCallback(() => {
        setStep((prev) => Math.max(prev - 1, 1))
        // Scroll to top when going back to previous step
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" })
        }, 100)
    }, [])

    const steps = [
        "Personal Information",
        "Document Upload",
        "Processing & Shipping",
        "Payment",
    ]

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h2 className="section-title">Personal Information</h2>

                        {/* Personal Information */}
                        <div className="form-section">
                            <div className="form-grid">
                                <FormField
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    placeholder="name@email.com"
                                    required
                                    value={formData.email}
                                    onChange={handleFieldChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("email")}
                                    error={fieldErrors.email}
                                    touched={touched.email}
                                />

                                <FormField
                                    label="Phone Number"
                                    name="phone"
                                    type="tel"
                                    placeholder="Enter your phone number with country code (e.g., +1 555-123-4567)"
                                    required
                                    value={formData.phone}
                                    onChange={handleFieldChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("phone")}
                                    error={fieldErrors.phone}
                                    touched={touched.phone}
                                />
                            </div>
                        </div>

                        {/* Driver's License Information */}
                        <div className="form-section">
                            <h3 className="form-subtitle">
                                Driver's License Information
                            </h3>
                            <p className="form-subtext">
                                Enter information exactly as it appears on your
                                license
                            </p>

                            <div className="form-grid">
                                <div className="name-row">
                                    <FormField
                                        label="First Name"
                                        name="firstName"
                                        placeholder="Name"
                                        required
                                        value={formData.firstName}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("firstName")}
                                        error={fieldErrors.firstName}
                                        touched={touched.firstName}
                                    />
                                    <FormField
                                        label="Middle Name"
                                        name="middleName"
                                        placeholder="Name"
                                        value={formData.middleName}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("middleName")}
                                        error={fieldErrors.middleName}
                                        touched={touched.middleName}
                                    />
                                    <FormField
                                        label="Last Name"
                                        name="lastName"
                                        placeholder="Name"
                                        required
                                        value={formData.lastName}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("lastName")}
                                        error={fieldErrors.lastName}
                                        touched={touched.lastName}
                                    />
                                </div>

                                <FormField
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    placeholder="MM/DD/YYYY"
                                    required
                                    tooltip="Applicants must be at least 18 years old."
                                    value={formData.dateOfBirth}
                                    onChange={handleFieldChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("dateOfBirth")}
                                    error={fieldErrors.dateOfBirth}
                                    touched={touched.dateOfBirth}
                                />

                                <FormField
                                    label="Driver's License Number"
                                    name="licenseNumber"
                                    placeholder="123456789"
                                    required
                                    value={formData.licenseNumber}
                                    onChange={handleFieldChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("licenseNumber")}
                                    error={fieldErrors.licenseNumber}
                                    touched={touched.licenseNumber}
                                />

                                <FormField
                                    label="State of Issue"
                                    name="licenseState"
                                    required
                                    value={formData.licenseState}
                                    onChange={handleFieldChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("licenseState")}
                                    error={fieldErrors.licenseState}
                                    touched={touched.licenseState}
                                    options={[
                                        { value: "", label: "Please Select" },
                                        { value: "AL", label: "AL" },
                                        { value: "AK", label: "AK" },
                                        { value: "AZ", label: "AZ" },
                                        { value: "AR", label: "AR" },
                                        { value: "CA", label: "CA" },
                                        { value: "CO", label: "CO" },
                                        { value: "CT", label: "CT" },
                                        { value: "DE", label: "DE" },
                                        { value: "DC", label: "DC" },
                                        { value: "FL", label: "FL" },
                                        { value: "GA", label: "GA" },
                                        { value: "HI", label: "HI" },
                                        { value: "ID", label: "ID" },
                                        { value: "IL", label: "IL" },
                                        { value: "IN", label: "IN" },
                                        { value: "IA", label: "IA" },
                                        { value: "KS", label: "KS" },
                                        { value: "KY", label: "KY" },
                                        { value: "LA", label: "LA" },
                                        { value: "ME", label: "ME" },
                                        { value: "MD", label: "MD" },
                                        { value: "MA", label: "MA" },
                                        { value: "MI", label: "MI" },
                                        { value: "MN", label: "MN" },
                                        { value: "MS", label: "MS" },
                                        { value: "MO", label: "MO" },
                                        { value: "MT", label: "MT" },
                                        { value: "NE", label: "NE" },
                                        { value: "NV", label: "NV" },
                                        { value: "NH", label: "NH" },
                                        { value: "NJ", label: "NJ" },
                                        { value: "NM", label: "NM" },
                                        { value: "NY", label: "NY" },
                                        { value: "NC", label: "NC" },
                                        { value: "ND", label: "ND" },
                                        { value: "OH", label: "OH" },
                                        { value: "OK", label: "OK" },
                                        { value: "OR", label: "OR" },
                                        { value: "PA", label: "PA" },
                                        { value: "RI", label: "RI" },
                                        { value: "SC", label: "SC" },
                                        { value: "SD", label: "SD" },
                                        { value: "TN", label: "TN" },
                                        { value: "TX", label: "TX" },
                                        { value: "UT", label: "UT" },
                                        { value: "VT", label: "VT" },
                                        { value: "VA", label: "VA" },
                                        { value: "WA", label: "WA" },
                                        { value: "WV", label: "WV" },
                                        { value: "WI", label: "WI" },
                                        { value: "WY", label: "WY" },
                                    ]}
                                />

                                <FormField
                                    label="License Expiration Date"
                                    name="licenseExpiration"
                                    type="date"
                                    placeholder="mm/dd/yyyy"
                                    required
                                    tooltip="AAA does not accept expired licenses. If your license is expired, please enter today's date and contact us."
                                    value={formData.licenseExpiration}
                                    onChange={handleFieldChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass(
                                        "licenseExpiration"
                                    )}
                                    error={fieldErrors.licenseExpiration}
                                    touched={touched.licenseExpiration}
                                />
                            </div>

                            {/* Address Fields with EasyPost Integration */}
                            <div className="form-grid address-section">
                                <AddressField
                                    label="Street Address"
                                    name="streetAddress"
                                    placeholder="1234 Street Dr"
                                    required
                                    tooltip="This is the address that appears on your license. It's okay if it doesn't match your current home address. Shipping address will be added later."
                                    value={formData.streetAddress}
                                    onChange={handleAddressChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("streetAddress")}
                                    addressClass={getAddressValidationClass()}
                                    error={fieldErrors.streetAddress}
                                    touched={touched.streetAddress}
                                />

                                <AddressField
                                    label="Street Address 2"
                                    name="streetAddress2"
                                    placeholder="Apt / Suite #"
                                    value={formData.streetAddress2}
                                    onChange={handleFieldChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("streetAddress2")}
                                    error={fieldErrors.streetAddress2}
                                    touched={touched.streetAddress2}
                                />

                                <div className="city-state-zip-row">
                                    <AddressField
                                        label="City"
                                        name="city"
                                        placeholder="City Name"
                                        required
                                        value={formData.city}
                                        onChange={handleAddressChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("city")}
                                        addressClass={getAddressValidationClass()}
                                        error={fieldErrors.city}
                                        touched={touched.city}
                                    />

                                    <FormField
                                        label="State"
                                        name="state"
                                        required
                                        value={formData.state}
                                        onChange={handleAddressChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("state")}
                                        error={fieldErrors.state}
                                        touched={touched.state}
                                        options={[
                                            {
                                                value: "",
                                                label: "Please Select",
                                            },
                                            { value: "AL", label: "AL" },
                                            { value: "AK", label: "AK" },
                                            { value: "AZ", label: "AZ" },
                                            { value: "AR", label: "AR" },
                                            { value: "CA", label: "CA" },
                                            { value: "CO", label: "CO" },
                                            { value: "CT", label: "CT" },
                                            { value: "DE", label: "DE" },
                                            { value: "DC", label: "DC" },
                                            { value: "FL", label: "FL" },
                                            { value: "GA", label: "GA" },
                                            { value: "HI", label: "HI" },
                                            { value: "ID", label: "ID" },
                                            { value: "IL", label: "IL" },
                                            { value: "IN", label: "IN" },
                                            { value: "IA", label: "IA" },
                                            { value: "KS", label: "KS" },
                                            { value: "KY", label: "KY" },
                                            { value: "LA", label: "LA" },
                                            { value: "ME", label: "ME" },
                                            { value: "MD", label: "MD" },
                                            { value: "MA", label: "MA" },
                                            { value: "MI", label: "MI" },
                                            { value: "MN", label: "MN" },
                                            { value: "MS", label: "MS" },
                                            { value: "MO", label: "MO" },
                                            { value: "MT", label: "MT" },
                                            { value: "NE", label: "NE" },
                                            { value: "NV", label: "NV" },
                                            { value: "NH", label: "NH" },
                                            { value: "NJ", label: "NJ" },
                                            { value: "NM", label: "NM" },
                                            { value: "NY", label: "NY" },
                                            { value: "NC", label: "NC" },
                                            { value: "ND", label: "ND" },
                                            { value: "OH", label: "OH" },
                                            { value: "OK", label: "OK" },
                                            { value: "OR", label: "OR" },
                                            { value: "PA", label: "PA" },
                                            { value: "RI", label: "RI" },
                                            { value: "SC", label: "SC" },
                                            { value: "SD", label: "SD" },
                                            { value: "TN", label: "TN" },
                                            { value: "TX", label: "TX" },
                                            { value: "UT", label: "UT" },
                                            { value: "VT", label: "VT" },
                                            { value: "VA", label: "VA" },
                                            { value: "WA", label: "WA" },
                                            { value: "WV", label: "WV" },
                                            { value: "WI", label: "WI" },
                                            { value: "WY", label: "WY" },
                                            { value: "AS", label: "AS" },
                                            { value: "GU", label: "GU" },
                                            { value: "MP", label: "MP" },
                                            { value: "UM", label: "UM" },
                                            { value: "VI", label: "VI" },
                                        ]}
                                    />

                                    <AddressField
                                        label="Zip Code"
                                        name="zipCode"
                                        placeholder="12345"
                                        required
                                        tooltip="ZIP extension not required"
                                        value={formData.zipCode}
                                        onChange={handleAddressChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("zipCode")}
                                        addressClass={getAddressValidationClass()}
                                        error={fieldErrors.zipCode}
                                        touched={touched.zipCode}
                                    />
                                </div>
                            </div>

                            {/* Address Validation Status */}
                            {addressValidation.status === "validating" && (
                                <div className="validation-status validation-loading">
                                    <span className="loading-spinner"></span>
                                    🔄 Validating address...
                                </div>
                            )}

                            {rateLimitState.isBlocked && (
                                <div className="alert alert-warning">
                                    ⏳ Address validation temporarily paused.
                                    Please wait{" "}
                                    {Math.ceil(
                                        (rateLimitState.blockUntil -
                                            Date.now()) /
                                            1000
                                    )}{" "}
                                    seconds.
                                </div>
                            )}

                            {addressValidation.status === "error" && (
                                <div className="alert alert-error">
                                    ⚠️ {addressValidation.error || "Address validation encountered an error. You can still continue with your application."}
                                    {addressValidation.canBypass && (
                                        <button
                                            type="button"
                                            className="btn-link"
                                            onClick={() =>
                                                setAddressValidation(
                                                    (prev) => ({
                                                        ...prev,
                                                        status: "valid",
                                                        error: null,
                                                    })
                                                )
                                            }
                                        >
                                            Continue without validation
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Address validation success notification removed - keeping validation informational only */}

                            {addressValidation.status ===
                                "needs-correction" && (
                                <div className="alert alert-warning">
                                    ⚠️ Address suggestion available. You can select the suggested address below or continue with your original address.
                                </div>
                            )}

                            {addressValidation.status === "invalid" && (
                                <div className="alert alert-warning">
                                    ⚠️{" "}
                                    {addressValidation.error ||
                                        "Address could not be validated. You can still continue with your application."}
                                </div>
                            )}

                            {/* Address Suggestions */}
                            {addressValidation.showSuggestions && (
                                <div className="suggestions-dropdown">
                                    <div className="suggestions-header">
                                        {addressValidation.status === "valid"
                                            ? "Suggested standardized address:"
                                            : "Select the correct address:"}
                                    </div>
                                    {addressValidation.suggestions.map(
                                        (suggestion, index) => (
                                            <div
                                                key={index}
                                                className="suggestion-item"
                                                onClick={() =>
                                                    acceptSuggestion(suggestion)
                                                }
                                            >
                                                <div className="suggestion-address">
                                                    {suggestion.street1}
                                                    {suggestion.street2 &&
                                                        `, ${suggestion.street2}`}
                                                </div>
                                                <div className="suggestion-location">
                                                    {suggestion.city},{" "}
                                                    {suggestion.state}{" "}
                                                    {suggestion.zip}
                                                </div>
                                            </div>
                                        )
                                    )}
                                    <div
                                        className="suggestion-item keep-original"
                                        onClick={() =>
                                            setAddressValidation((prev) => ({
                                                ...prev,
                                                showSuggestions: false,
                                                status: "valid",
                                            }))
                                        }
                                    >
                                        {addressValidation.status === "valid"
                                            ? "✓ Keep my format"
                                            : "✓ Keep my original address"}
                                    </div>
                                </div>
                            )}

                            {/* License Types */}
                            <div className="form-field full-width license-types-section">
                                <label className="form-label">
                                    <span className="label-content">
                                        What kind of driver's license(s) do you
                                        have?
                                        <span className="required-asterisk">
                                            *
                                        </span>
                                        <Tooltip
                                            content={`Most people will select "Passenger Car" which is equivalent to a standard Class D license in most states.\n\nNote: Motorcycle license/endorsement must be indicated on your US driver's license for AAA to issue a motorcycle endorsement on your IDP.`}
                                        >
                                            <span className="info-icon">ⓘ</span>
                                        </Tooltip>
                                    </span>
                                </label>
                                <div className="checkbox-group">
                                    {[
                                        {
                                            value: "Passenger Car",
                                            label: "Passenger Car",
                                        },
                                        {
                                            value: "Motorcycle",
                                            label: "Motorcycle",
                                        },
                                        {
                                            value: "Commercial / Other",
                                            label: "Commercial / Other",
                                        },
                                    ].map((license) => (
                                        <label
                                            key={license.value}
                                            className="checkbox-label"
                                        >
                                            <input
                                                type="checkbox"
                                                name="licenseTypes"
                                                value={license.value}
                                                checked={formData.licenseTypes.includes(
                                                    license.value
                                                )}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "licenseTypes",
                                                        license.value,
                                                        e
                                                    )
                                                }
                                            />
                                            <span className="checkbox-text">
                                                {license.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {fieldErrors.licenseTypes && (
                                    <span className="error-message">
                                        {fieldErrors.licenseTypes}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Other Info Required by AAA */}
                        <div className="form-section">
                            <h3 className="form-subtitle no-subtext">
                                Other Info Required by AAA
                            </h3>
                            <div className="form-grid">
                                <FormField
                                    label="Birthplace City"
                                    name="birthplaceCity"
                                    placeholder="City Name"
                                    required
                                    value={formData.birthplaceCity}
                                    onChange={(name, value) => {
                                        // Only allow letters, spaces, hyphens, apostrophes, and periods
                                        const textOnly = value.replace(/[^a-zA-Z\s\-'.]/g, '')
                                        handleFieldChange(name, textOnly)
                                    }}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("birthplaceCity")}
                                    error={fieldErrors.birthplaceCity}
                                    touched={touched.birthplaceCity}
                                />

                                <div className="form-group required">
                                    <label className="form-label">
                                        <span className="label-content">
                                            Birthplace State
                                            <span className="required-asterisk"> *</span>
                                            <Tooltip content="If you were born within the United States, list your birth state. If you were born outside the United States, list your birth country.">
                                                <span className="info-icon">ⓘ</span>
                                            </Tooltip>
                                        </span>
                                    </label>
                                    <input
                                        name="birthplaceState"
                                        value={formData.birthplaceState}
                                        onChange={(e) => {
                                            // Only allow letters, spaces, hyphens, apostrophes, and periods
                                            const textOnly = e.target.value.replace(/[^a-zA-Z\s\-'.]/g, '')
                                            handleFieldChange(
                                                "birthplaceState",
                                                textOnly
                                            )
                                        }}
                                        onBlur={() =>
                                            handleBlur("birthplaceState")
                                        }
                                        className={`form-input ${getFieldClass("birthplaceState")}`}
                                        placeholder="Enter country if born outside US"
                                    />
                                    <div className="error-space">
                                        {fieldErrors.birthplaceState &&
                                            touched.birthplaceState && (
                                                <span className="field-error-message">
                                                    {fieldErrors.birthplaceState}
                                                </span>
                                            )}
                                    </div>
                                </div>

                                <FormField
                                    label="Where will you drive while abroad?"
                                    name="driveAbroad"
                                    required
                                    tooltip="AAA asks for this. Regardless of what you write, your IDP will be valid in 170+ countries."
                                    placeholder="Enter country/countries (e.g., Italy, Japan)"
                                    value={formData.driveAbroad}
                                    onChange={(name, value) => {
                                        // Only allow letters, spaces, hyphens, apostrophes, periods, and commas
                                        const textOnly = value.replace(/[^a-zA-Z\s\-'.,]/g, '')
                                        handleFieldChange(name, textOnly)
                                    }}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("driveAbroad")}
                                    error={fieldErrors.driveAbroad}
                                    touched={touched.driveAbroad}
                                />

                                <FormField
                                    label="Departure Date from USA"
                                    name="departureDate"
                                    type="date"
                                    placeholder="MM/DD/YYYY"
                                    required
                                    tooltip="If you're not sure of the exact date when you departed or will depart, an estimate is acceptable."
                                    value={formData.departureDate}
                                    onChange={handleFieldChange}
                                    onBlur={handleBlur}
                                    fieldClass={getFieldClass("departureDate")}
                                    error={fieldErrors.departureDate}
                                    touched={touched.departureDate}
                                />
                            </div>

                            {/* Permit Selection */}
                            <div className="form-field full-width">
                                <label className="field-label">
                                    <span className="label-content">
                                        Select desired permit(s) - $20 each
                                        <span className="required-asterisk">
                                            *
                                        </span>
                                        <Tooltip content="Most people should only select International Driving Permit (first option).\n\nBrazil and Uruguay do not recognize IDPs. Instead, they recognize the Inter-American Driving Permit (IADP). If you plan on driving in Brazil / Uruguay AND additional countries, select both permits. AAA charges $20 for each permit (i.e., $40 if both are selected).">
                                            <span className="info-icon">ⓘ</span>
                                        </Tooltip>
                                    </span>
                                </label>
                                <div className="checkbox-group">
                                    {[
                                        {
                                            value: "International Driving Permit",
                                            label: "International Driving Permit",
                                        },
                                        {
                                            value: "IAPD (Brazil / Uruguay only)",
                                            label: "IAPD (Brazil / Uruguay only)",
                                        },
                                    ].map((permit) => (
                                        <label
                                            key={permit.value}
                                            className="checkbox-label"
                                        >
                                            <input
                                                type="checkbox"
                                                name="selectedPermits"
                                                value={permit.value}
                                                checked={formData.selectedPermits.includes(
                                                    permit.value
                                                )}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "selectedPermits",
                                                        permit.value,
                                                        e
                                                    )
                                                }
                                            />
                                            <span className="checkbox-text">
                                                {permit.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {fieldErrors.selectedPermits && (
                                    <span className="error-message">
                                        {fieldErrors.selectedPermits}
                                    </span>
                                )}
                            </div>

                            <FormField
                                label="Permit Effective Date"
                                name="permitEffectiveDate"
                                type="date"
                                placeholder="MM/DD/YYYY"
                                required
                                tooltip="IDPs are valid for one year from the permit effective date and may be future-dated up to 6 months from the date of application."
                                value={formData.permitEffectiveDate}
                                onChange={handleFieldChange}
                                onBlur={handleBlur}
                                fieldClass={getFieldClass(
                                    "permitEffectiveDate"
                                )}
                                error={fieldErrors.permitEffectiveDate}
                                touched={touched.permitEffectiveDate}
                            />

                            <SignatureField
                                label="Digital Signature"
                                name="signature"
                                required
                                value={formData.signature}
                                onChange={handleFieldChange}
                                error={fieldErrors.signature}
                                touched={touched.signature}
                                tooltip="By submitting this application, the applicant authorizes Fast IDP and its representatives to reproduce, affix, or otherwise apply the applicant's signature, as provided on this form, to the official American Automobile Association (AAA) International Driving Permit application form. The applicant acknowledges and agrees that such reproduced signature shall have the same legal effect as if personally signed by the applicant."
                            />

                            <div className="form-group required">
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.termsAgreement}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "termsAgreement",
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        <span className="checkbox-text">
                                            By signing, I agree to the{" "}
                                            {/* Previous URL (rollback): https://ambiguous-methodologies-053772.framer.app/terms */}
                                            <a
                                                href="https://serious-flows-972417.framer.app/terms"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: "#007bff",
                                                    textDecoration: "underline",
                                                }}
                                            >
                                                Terms & Conditions
                                            </a>
                                            . I understand Fast IDP is not
                                            responsible for delays or loss
                                            caused by the carrier.{" "}
                                            <span style={{ color: "red" }}>
                                                *
                                            </span>
                                        </span>
                                    </label>
                                </div>
                                {fieldErrors.termsAgreement && (
                                    <span className="error-message">
                                        {fieldErrors.termsAgreement}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            case 2:
                return (
                    <div>
                        <h2 className="section-title">Document Upload</h2>
                        {[
                            {
                                label: "Upload photos of license (front and back)",
                                type: "driversLicense",
                            },
                            {
                                label: "Upload Passport-Style Photo",
                                type: "passportPhoto",
                            },
                        ].map(({ label, type }, index) => (
                            <div className="file-upload-section" key={index}>
                                <h3 className="upload-section-title">{label}</h3>
                                
                                <div
                                    className={`upload-box-redesigned ${uploadedFiles[type].length > 0 ? "has-files" : ""}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, type)}
                                    onClick={() =>
                                        document
                                            .getElementById(
                                                `file-input-${type}`
                                            )
                                            .click()
                                    }
                                >
                                    <div className="upload-header">
                                        <div className="upload-icon-redesigned">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#6b7280">
                                                <path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8 9.79 12 12 12M12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
                                            </svg>
                                        </div>
                                        <div className="upload-text-redesigned">
                                            <strong>Click to upload or drag files here</strong>
                                            <span>Supports multiple files (images & PDFs)</span>
                                        </div>
                                    </div>

                                    {/* Show uploaded files inside the upload area */}
                                    {uploadedFiles[type].length > 0 && (
                                        <div className="files-preview-embedded">
                                            <div className="files-header">
                                                {uploadedFiles[type].length} file{uploadedFiles[type].length !== 1 ? 's' : ''} ready to upload
                                            </div>
                                            <div className="files-grid-embedded">
                                                {uploadedFiles[type].map(
                                                    (file, fileIndex) => (
                                                        <div
                                                            key={fileIndex}
                                                            className="file-chip"
                                                        >
                                                            {file.type.startsWith('image/') ? (
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`Preview ${fileIndex + 1}`}
                                                                    className="file-chip-thumb"
                                                                />
                                                            ) : (
                                                                <div className="file-chip-thumb pdf-icon">
                                                                    📄
                                                                </div>
                                                            )}
                                                            <span className="file-chip-name">
                                                                {file.name.length > 15 
                                                                    ? file.name.substring(0, 15) + '...' 
                                                                    : file.name}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeFile(type, fileIndex);
                                                                }}
                                                                className="file-chip-remove"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        id={`file-input-${type}`}
                                        type="file"
                                        className="upload-input"
                                        multiple
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,application/pdf"
                                        onChange={(e) =>
                                            handleFileUpload(
                                                e.target.files,
                                                type
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Head Shot Guidelines */}
                        <div className="guidelines-section">
                            <h3 className="guidelines-title">
                                Head Shot Guidelines
                            </h3>
                            <ul className="guidelines-list">
                                <li>
                                    Take a photo facing directly toward the camera with shoulders in the frame, a solid background, no shadows, a neutral expression, and no glasses or hat.{" "}
                                    <a
                                        href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="guidelines-link"
                                    >
                                        Examples here
                                    </a>
                                    .
                                </li>
                                <li>
                                    A landscape-orientation selfie works best; we'll crop your photo before submitting it.
                                </li>
                                <li>
                                    Do not upload a photo of a printed photo or
                                    passport.
                                </li>
                            </ul>
                            <div className="guidelines-image">
                                <img
                                    src="https://files.jotform.com/jufs/Mike_Schmit/form_files/Passport%20photo%20examples%20Fast%20IDP%20apply%20page2.67ba4fcea306b4.67258182.png?md5=q4i-7HNNgknx-fF-fJPj0Q&expires=1754667396"
                                    alt="Photo guidelines showing acceptable and unacceptable passport-style photos"
                                    className="example-photos"
                                />
                            </div>
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div className="processing-shipping-classic">
                        <h2 className="section-title">
                            Processing & Shipping
                            <p style={{ marginBottom: '0', color: '#666', fontSize: '14px', fontWeight: 'normal', marginTop: '8px' }}>
                                The total cost includes the fee shown below, plus tax and a $20 IDP booklet fee paid to AAA.
                            </p>
                        </h2>
                        
                        {/* 1. SHIPPING CATEGORY - Always visible first */}
                        <div className="classic-field">
                            <label className="classic-label">
                                Where are you shipping?{" "}
                                <span className="required-asterisk">*</span>
                            </label>
                            <div className="selectable-box-group">
                                {[
                                    {
                                        value: "domestic",
                                        label: "Domestic",
                                        sub: "US States & Terr.",
                                    },
                                    {
                                        value: "international",
                                        label: "International",
                                        sub: "Outside US",
                                    },
                                    {
                                        value: "military",
                                        label: "Military",
                                        sub: "APO/FPO/DPO",
                                    },
                                ].map((option) => (
                                    <div
                                        key={option.value}
                                        className={`selectable-box ${
                                            formData.shippingCategory === option.value
                                                ? "selected"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            handleFieldChange(
                                                "shippingCategory",
                                                option.value
                                            )
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name="shippingCategory"
                                            value={option.value}
                                            checked={
                                                formData.shippingCategory ===
                                                option.value
                                            }
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "shippingCategory",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <div className="selectable-box-content">
                                            <div className="selectable-box-label">
                                                {option.label}
                                            </div>
                                            <div className="selectable-box-sub">
                                                {option.sub}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {fieldErrors.shippingCategory &&
                                touched.shippingCategory && (
                                    <div className="error-message">
                                        {fieldErrors.shippingCategory}
                                    </div>
                                )}
                        </div>
                        
                        {/* 2. PROCESSING SPEED - Only show after shipping category selected */}
                        {formData.shippingCategory && (
                            <div className="classic-field">
                                <label className="classic-label">
                                    How fast do you need your IDP?{" "}
                                    <span className="required-asterisk">*</span>
                                </label>
                                <div className="subtitle-note">Delivery times to US Territories may be longer</div>
                                <div className="selectable-box-group">
                                    {(() => {
                                        const getProcessingOptions = () => {
                                            const category = formData.shippingCategory
                                            if (category === "domestic") {
                                                return [
                                                    {
                                                        value: "standard",
                                                        label: "Standard",
                                                        price: "$58",
                                                        sub: "Arrives in 6-8 business days - longer for US Territories",
                                                        backendNote: "3-5 business days processing & standard shipping"
                                                    },
                                                    {
                                                        value: "fast",
                                                        label: "Fast",
                                                        price: "$108",
                                                        sub: "Arrives in 3-4 business days - longer for US Territories",
                                                        backendNote: "1-2 business days processing & expedited shipping"
                                                    },
                                                    {
                                                        value: "fastest",
                                                        label: "Fastest",
                                                        price: "$168",
                                                        sub: "Arrives the next business day (or in 2 bus. days if application is received after noon ET - longer for US territories",
                                                        backendNote: "Same-day processing & overnight shipping"
                                                    }
                                                ]
                                            } else if (category === "international") {
                                                return [
                                                    {
                                                        value: "standard",
                                                        label: "Standard",
                                                        price: "$98",
                                                        sub: "Arrives in 7-10 business days",
                                                        backendNote: "3-5 business days processing & standard shipping"
                                                    },
                                                    {
                                                        value: "fast",
                                                        label: "Fast",
                                                        price: "$148",
                                                        sub: "Arrives in 4-7 business days",
                                                        backendNote: "1-2 business days processing & expedited shipping"
                                                    },
                                                    {
                                                        value: "fastest",
                                                        label: "Fastest",
                                                        price: "$198",
                                                        sub: "Processing by noon ET. Arrives in 2-5 business days - contact us for your location's shipping timeline",
                                                        backendNote: "Same-day processing & overnight shipping"
                                                    }
                                                ]
                                            } else if (category === "military") {
                                                return [
                                                    {
                                                        value: "standard",
                                                        label: "Standard",
                                                        price: "$49",
                                                        sub: "Arrives in 8-15 business days",
                                                        backendNote: "3-5 business days processing & standard shipping"
                                                    },
                                                    {
                                                        value: "fast",
                                                        label: "Fast",
                                                        price: "$89",
                                                        sub: "Arrives in 6-12 business days",
                                                        backendNote: "1-2 business days processing & expedited shipping"
                                                    },
                                                    {
                                                        value: "fastest",
                                                        label: "Fastest",
                                                        price: "$119",
                                                        sub: "Arrives in 5-11 business days",
                                                        backendNote: "Same-day processing & overnight shipping"
                                                    }
                                                ]
                                            }
                                            return []
                                        }
                                        return getProcessingOptions().map((option) => (
                                            <div
                                                key={option.value}
                                                className={`selectable-box ${
                                                    formData.processingOption === option.value
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handleFieldChange(
                                                        "processingOption",
                                                        option.value
                                                    )
                                                }
                                            >
                                                <input
                                                    type="radio"
                                                    name="processingOption"
                                                    value={option.value}
                                                    checked={
                                                        formData.processingOption ===
                                                        option.value
                                                    }
                                                    onChange={(e) =>
                                                        handleFieldChange(
                                                            "processingOption",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <div className="selectable-box-content">
                                                    <div className="selectable-box-label">
                                                        {option.label}
                                                    </div>
                                                    <div className="selectable-box-sub">
                                                        {option.sub}
                                                    </div>
                                                </div>
                                                <div className="selectable-box-price">
                                                    {option.price}
                                                </div>
                                            </div>
                                        ))
                                    })()}
                                </div>
                                {fieldErrors.processingOption &&
                                    touched.processingOption && (
                                        <div className="error-message">
                                            {fieldErrors.processingOption}
                                        </div>
                                    )}
                            </div>
                        )}
                        
                        {/* International Shipping Address Fields - Only show when International is selected */}
                        {formData.shippingCategory === "international" && (
                            <div className="classic-field">
                                <label className="classic-label">
                                    International Shipping Details
                                </label>
                                <div className="international-address-fields">
                                    <FormField
                                        label="Recipient Name"
                                        name="recipientName"
                                        required
                                        value={formData.recipientName || ""}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("recipientName")}
                                        error={fieldErrors.recipientName}
                                        touched={touched.recipientName}
                                        tooltip="Enter the name of who will receive the shipment, if different than the applicant"
                                    />

                                    <FormField
                                        label="Recipient Phone Number"
                                        name="recipientPhone"
                                        type="tel"
                                        required
                                        value={formData.recipientPhone}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("recipientPhone")}
                                        error={fieldErrors.recipientPhone}
                                        touched={touched.recipientPhone}
                                        tooltip="Enter the phone number, ideally from the destination country, of the shipment carrier should contact with delivery questions"
                                    />

                                    {/* Country Selection and PCCC Fields */}
                                    <div className="form-row" style={{ display: "flex", alignItems: "flex-start", gap: "15px" }}>
                                        <div className="form-group" style={{ flex: formData.shippingCountry === "KR" ? "1" : "2" }}>
                                            <label className="form-label">
                                                Shipping Address: Country <span className="required-asterisk">*</span>
                                            </label>
                                            <select
                                                name="shippingCountry"
                                                value={formData.shippingCountry || ""}
                                                onChange={(e) => handleFieldChange("shippingCountry", e.target.value)}
                                                onBlur={handleBlur}
                                                className={`form-input ${getFieldClass("shippingCountry")}`}
                                                required
                                            >
                                                <option value="">Please Select</option>
                                                {countries
                                                    .filter(country => country.code !== "US") // Exclude US since it's not international
                                                    .map((country) => (
                                                    <option key={country.code} value={country.code}>
                                                        {country.flag} {country.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {fieldErrors.shippingCountry && touched.shippingCountry && (
                                                <div className="error-message">
                                                    {fieldErrors.shippingCountry}
                                                </div>
                                            )}
                                        </div>

                                        {/* PCCC Field - Only show when South Korea is selected */}
                                        {formData.shippingCountry === "KR" && (
                                            <div className="form-group" style={{ flex: "1" }}>
                                                <FormField
                                                    label="PCCC for Korean Customs"
                                                    name="pcccCode"
                                                    placeholder="Enter PCCC code"
                                                    required
                                                    value={formData.pcccCode || ""}
                                                    onChange={handleFieldChange}
                                                    onBlur={handleBlur}
                                                    fieldClass={getFieldClass("pcccCode")}
                                                    error={fieldErrors.pcccCode}
                                                    touched={touched.pcccCode}
                                                    tooltip="Personal Customs Clearance Code required for shipments to South Korea"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Shipping Address - must be written in English characters <span className="required-asterisk">*</span>
                                        </label>
                                        <textarea
                                            name="internationalFullAddress"
                                            placeholder="Please provide your complete address including street, city, state/province, postal code, and country"
                                            value={formData.internationalFullAddress}
                                            onChange={(e) => handleFieldChange("internationalFullAddress", e.target.value)}
                                            onBlur={handleBlur}
                                            className={getFieldClass("internationalFullAddress")}
                                            rows="3"
                                            required
                                        />
                                        {fieldErrors.internationalFullAddress && touched.internationalFullAddress && (
                                            <div className="error-message">
                                                {fieldErrors.internationalFullAddress}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">
                                            Shipping Address - in local language
                                        </label>
                                        <textarea
                                            name="internationalLocalAddress"
                                            placeholder="If applicable, please provide your address in the local language/script"
                                            value={formData.internationalLocalAddress}
                                            onChange={(e) => handleFieldChange("internationalLocalAddress", e.target.value)}
                                            onBlur={handleBlur}
                                            className={getFieldClass("internationalLocalAddress")}
                                            rows="3"
                                        />
                                        {fieldErrors.internationalLocalAddress && touched.internationalLocalAddress && (
                                            <div className="error-message">
                                                {fieldErrors.internationalLocalAddress}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <TextareaField
                                        label="Delivery Instructions / Comments"
                                        name="internationalDeliveryInstructions"
                                        placeholder="(Optional) Any special delivery instructions or other comments"
                                        value={formData.internationalDeliveryInstructions}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("internationalDeliveryInstructions")}
                                        error={fieldErrors.internationalDeliveryInstructions}
                                        touched={touched.internationalDeliveryInstructions}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* Shipping Address Collection - Only for Domestic and Military (not International) */}
                        {formData.shippingCategory && formData.shippingCategory !== "international" && (
                            <div className="classic-field">
                                <label className="classic-label">
                                    Shipping Address <span className="required-asterisk">*</span>
                                </label>
                                <div className="form-subtext">
                                    This will be used for delivery of your International Driving Permit
                                </div>
                            <div className="form-group">
                                <div className="custom-address-fields">
                                    <FormField
                                        label="Recipient Name"
                                        name="recipientName"
                                        required
                                        value={formData.recipientName || ""}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("recipientName")}
                                        error={fieldErrors.recipientName}
                                        touched={touched.recipientName}
                                        tooltip="Enter the name of who will receive the shipment, if different than the applicant"
                                    />

                                    <FormField
                                        label="Recipient Phone Number"
                                        name="recipientPhone"
                                        type="tel"
                                        required
                                        value={formData.recipientPhone || ""}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("recipientPhone")}
                                        error={fieldErrors.recipientPhone}
                                        touched={touched.recipientPhone}
                                        tooltip="Enter the phone number the shipment carrier should contact with delivery questions."
                                    />
                                    
                                    <div className="form-group">
                                        <label className="form-label">
                                            Street Address <span className="required-asterisk">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="shippingStreetAddress"
                                            placeholder="123 Main Street"
                                            value={formData.shippingStreetAddress || ""}
                                            onChange={(e) => {
                                                handleFieldChange("shippingStreetAddress", e.target.value)
                                            }}
                                            onBlur={handleBlur}
                                            className={getFieldClass("shippingStreetAddress")}
                                            required
                                        />
                                        {fieldErrors.shippingStreetAddress && touched.shippingStreetAddress && (
                                            <div className="error-message">
                                                {fieldErrors.shippingStreetAddress}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">Street Address 2</label>
                                        <input
                                            type="text"
                                            name="shippingStreetAddress2"
                                            placeholder="Apt, Suite, Unit, etc."
                                            value={formData.shippingStreetAddress2 || ""}
                                            onChange={(e) => handleFieldChange("shippingStreetAddress2", e.target.value)}
                                            onBlur={handleBlur}
                                            className={getFieldClass("shippingStreetAddress2")}
                                        />
                                    </div>
                                    
                                    <div className="address-row">
                                        <div className="form-group">
                                            <label className="form-label">
                                                City <span className="required-asterisk">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="shippingCity"
                                                placeholder={formData.shippingCategory === "military" ? "APO/FPO/DPO only" : "City"}
                                                value={formData.shippingCity || ""}
                                                onChange={(e) => {
                                                    handleFieldChange("shippingCity", e.target.value)
                                                }}
                                                onBlur={handleBlur}
                                                className={getFieldClass("shippingCity")}
                                                required
                                            />
                                            {fieldErrors.shippingCity && touched.shippingCity && (
                                                <div className="error-message">
                                                    {fieldErrors.shippingCity}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="form-group">
                                            <label className="form-label">
                                                {formData.shippingCategory === "international" ? "State/Province (if applicable)" : "State"} <span className="required-asterisk">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="shippingState"
                                                placeholder={formData.shippingCategory === "military" ? "AA/AE/AP only" : formData.shippingCategory === "international" ? "State/Province (if applicable)" : "State"}
                                                value={formData.shippingState || ""}
                                                onChange={(e) => handleFieldChange("shippingState", e.target.value)}
                                                onBlur={handleBlur}
                                                className={getFieldClass("shippingState")}
                                                required
                                            />
                                            {fieldErrors.shippingState && touched.shippingState && (
                                                <div className="error-message">
                                                    {fieldErrors.shippingState}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="form-group">
                                            <label className="form-label">
                                                {formData.shippingCategory === "international" ? "Postal Code" : "ZIP Code"} <span className="required-asterisk">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="shippingPostalCode"
                                                placeholder={formData.shippingCategory === "international" ? "Postal Code" : "12345"}
                                                value={formData.shippingPostalCode || ""}
                                                onChange={(e) => handleFieldChange("shippingPostalCode", e.target.value)}
                                                onBlur={handleBlur}
                                                className={getFieldClass("shippingPostalCode")}
                                                required
                                            />
                                            {fieldErrors.shippingPostalCode && touched.shippingPostalCode && (
                                                <div className="error-message">
                                                    {fieldErrors.shippingPostalCode}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {formData.shippingCategory === "international" && (
                                        <div className="form-group">
                                            <label className="form-label">
                                                Country <span className="required-asterisk">*</span>
                                            </label>
                                            <select
                                                name="shippingCountry"
                                                value={formData.shippingCountry || ""}
                                                onChange={(e) => {
                                                    handleFieldChange("shippingCountry", e.target.value)
                                                    // Update our shipping address state for fulfillment type detection
                                                    setShippingAddress(prev => ({
                                                        ...prev,
                                                        country: e.target.value
                                                    }))
                                                }}
                                                onBlur={handleBlur}
                                                className={getFieldClass("shippingCountry")}
                                                required
                                            >
                                                <option value="">Select Country</option>
                                                {/* ROLLBACK: Replace with old hardcoded list if needed */}
                                                {/* Featured countries at top */}
                                                <optgroup label="━━━ Most Common ━━━">
                                                    <option value="IT">Italy</option>
                                                    <option value="JP">Japan</option>
                                                </optgroup>
                                                {/* All countries alphabetically */}
                                                <optgroup label="━━━ All Countries ━━━">
                                                    {countries
                                                        .filter(c => c.code !== 'US' && c.code !== 'IT' && c.code !== 'JP')
                                                        .sort((a, b) => a.name.localeCompare(b.name))
                                                        .map(country => (
                                                            <option key={country.code} value={country.code}>
                                                                {country.name}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                            </select>
                                            {fieldErrors.shippingCountry && touched.shippingCountry && (
                                                <div className="error-message">
                                                    {fieldErrors.shippingCountry}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <TextareaField
                                        label="Delivery Instructions / Comments"
                                        name="shippingDeliveryInstructions"
                                        placeholder="(Optional) Any special delivery instructions or other comments"
                                        value={formData.shippingDeliveryInstructions || ""}
                                        onChange={handleFieldChange}
                                        onBlur={handleBlur}
                                        fieldClass={getFieldClass("shippingDeliveryInstructions")}
                                        error={fieldErrors.shippingDeliveryInstructions}
                                        touched={touched.shippingDeliveryInstructions}
                                        rows={3}
                                    />
                                    
                                    {/* Shipping Address Validation Status */}
                                    {formData.shippingCategory && formData.shippingCategory !== "international" && (
                                        <>
                                            {shippingValidation.status === "validating" && (
                                                <div className="validation-status validation-loading">
                                                    <span className="loading-spinner"></span>
                                                    🔄 Validating address...
                                                </div>
                                            )}

                                            {shippingValidation.status === "error" && (
                                                <div className="alert alert-error">
                                                    ⚠️ {shippingValidation.error || "Address validation encountered an error. You can still continue with your application."}
                                                    {shippingValidation.canBypass && (
                                                        <button
                                                            type="button"
                                                            className="btn-link"
                                                            onClick={() =>
                                                                setShippingValidation(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        status: "valid",
                                                                        error: null,
                                                                    })
                                                                )
                                                            }
                                                        >
                                                            Continue without validation
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {shippingValidation.status === "needs-correction" && (
                                                <div className="alert alert-warning">
                                                    ⚠️ Address suggestion available. You can select the suggested address below or continue with your original address.
                                                </div>
                                            )}

                                            {shippingValidation.status === "invalid" && (
                                                <div className="alert alert-warning">
                                                    ⚠️{" "}
                                                    {shippingValidation.error ||
                                                        "Address could not be validated. You can still continue with your application."}
                                                </div>
                                            )}

                                            {/* Shipping Address Suggestions */}
                                            {shippingValidation.showSuggestions && (
                                                <div className="suggestions-dropdown">
                                                    <div className="suggestions-header">
                                                        {shippingValidation.status === "valid"
                                                            ? "EasyPost standardized your address:"
                                                            : "Select the correct address:"}
                                                    </div>
                                                    {shippingValidation.suggestions.map(
                                                        (suggestion, index) => (
                                                            <div
                                                                key={index}
                                                                className="suggestion-item"
                                                                onClick={() =>
                                                                    acceptShippingSuggestion(suggestion)
                                                                }
                                                            >
                                                                <div className="suggestion-address">
                                                                    {suggestion.street1}
                                                                    {suggestion.street2 &&
                                                                        `, ${suggestion.street2}`}
                                                                </div>
                                                                <div className="suggestion-location">
                                                                    {suggestion.city},{" "}
                                                                    {suggestion.state}{" "}
                                                                    {suggestion.zip}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                    <div
                                                        className="suggestion-item keep-original"
                                                        onClick={() =>
                                                            setShippingValidation((prev) => ({
                                                                ...prev,
                                                                showSuggestions: false,
                                                                status: "valid",
                                                            }))
                                                        }
                                                    >
                                                        {shippingValidation.status === "valid"
                                                            ? "✓ Keep my format"
                                                            : "✓ Keep my original address"}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                )
            case 4:
                return (
                    <div>
                        <h2 className="section-title">Payment</h2>

                        {paymentState.isComplete ? (
                            <div className="payment-success">
                                <div className="success-icon">✓</div>
                                <h3>Payment Complete!</h3>
                                <p>
                                    Your International Driving Permit
                                    application has been submitted and payment
                                    has been processed successfully.
                                </p>
                                <p>
                                    <strong>Payment ID:</strong>{" "}
                                    {paymentState.paymentIntentId}
                                </p>
                                <p>
                                    You will receive a confirmation email
                                    shortly with further instructions.
                                </p>
                            </div>
                        ) : paymentState.isLoading ? (
                            <div className="payment-loading">
                                <div className="loading-spinner"></div>
                                <p>Setting up payment...</p>
                            </div>
                        ) : paymentState.error ? (
                            <div className="payment-error">
                                <p>Error: {paymentState.error}</p>
                                <button
                                    onClick={setupPayment}
                                    className="btn primary"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : paymentState.clientSecret ? (
                            <StripePaymentWrapper
                                clientSecret={paymentState.clientSecret}
                                onPaymentSuccess={handlePaymentSuccess}
                                onPaymentError={handlePaymentError}
                                formData={formData}
                                onFieldChange={handleFieldChange}
                            />
                        ) : (
                            <div className="payment-loading">
                                <div className="loading-spinner"></div>
                                <p>Preparing payment...</p>
                            </div>
                        )}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="container">
            <div className="stepper">
                {steps.map((label, index) => (
                    <div key={index} className="step">
                        <div
                            className={`circle ${step === index + 1 ? "active" : ""}`}
                        >
                            {index + 1}
                        </div>
                        <div className="label">{label}</div>
                    </div>
                ))}
            </div>

            <div className="form-container">
                {renderStep()}
                <div className="button-row">
                    {step > 1 && !paymentState.isComplete && (
                        <button onClick={handleBack} className="btn">
                            ← Previous
                        </button>
                    )}
                    {step < 3 && (
                        <button onClick={handleNext} className="btn primary">
                            Next ➞
                        </button>
                    )}
                    {step === 3 && (
                        <button onClick={handleNext} className="btn primary">
                            Continue to Payment ➞
                        </button>
                    )}
                    {step === 4 && paymentState.isComplete && (
                        <button
                            onClick={() => window.location.reload()}
                            className="btn primary"
                        >
                            Submit New Application
                        </button>
                    )}
                </div>
            </div>

            <style>{`
            * {
                box-sizing: border-box;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            /* Prevent horizontal overflow */
            html, body {
                overflow-x: hidden;
            }
            
            /* Ensure proper touch targets on mobile */
            button, input, select, textarea {
                touch-action: manipulation;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                padding: 0 16px 60px 16px;
                overflow-x: hidden;
                width: 100%;
            }
            
            /* Stepper Styles */
            .stepper {
                display: flex;
                justify-content: space-between;
                margin-bottom: 32px;
                padding: 0 20px;
            }
            
            .step {
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 1;
                position: relative;
            }
            
            .step:not(:last-child)::after {
                content: '';
                position: absolute;
                top: 15px;
                left: 60%;
                right: -40%;
                height: 2px;
                background-color: #e5e7eb;
                z-index: 0;
            }
            
            .circle {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background-color: #e5e7eb;
                display: flex;
                justify-content: center;
                align-items: center;
                font-weight: 600;
                font-size: 14px;
                color: #6b7280;
                position: relative;
                z-index: 1;
                transition: all 0.3s ease;
            }
            
            .circle.active {
                background-color: #3b82f6;
                color: white;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            }
            
            .label {
                margin-top: 8px;
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                text-align: center;
            }
            
            /* Form Container */
            .form-container {
                background: #ffffff;
                padding: 32px;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border: 1px solid #f3f4f6;
            }
            
            /* Form Sections */
            .form-section {
                margin-bottom: 32px;
            }
            
            .form-section:last-child {
                margin-bottom: 0;
            }
            
            .section-title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 32px;
                color: #111827;
                border-bottom: 2px solid #f3f4f6;
                padding-bottom: 16px;
            }
            
            .form-subtitle {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 24px;
                color: #374151;
            }
            
            .form-subtitle.no-subtext {
                margin-bottom: 20px;
            }
            
            .form-subtext {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 24px;
                font-style: italic;
            }
            
            /* Form Layout */
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px 16px; /* vertical gap 20px, horizontal gap 16px */
                margin-bottom: 32px;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
                width: 100%;
                max-width: 100%;
                min-width: 0;
            }
            
            .form-group.full-width {
                grid-column: span 2;
            }
            
            .signature-field {
                grid-column: span 2;
                margin-top: 20px;
            }
            
            .signature-container {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                width: 100%;
            }
            
            .signature-canvas {
                border: 2px solid #ddd !important;
                border-radius: 8px !important;
                cursor: crosshair !important;
                background-color: #fff !important;
                max-width: 100% !important;
                width: 100% !important;
                height: 150px !important;
                touch-action: none !important;
                user-select: none !important;
                display: block !important;
                box-sizing: border-box !important;
            }
            
            .signature-container button {
                margin-top: 10px;
                padding: 8px 16px;
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .state-zip-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                grid-column: span 2;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                cursor: pointer;
                font-size: 14px;
                line-height: 1.4;
                margin-bottom: 16px;
            }
            
            .checkbox-label input[type="checkbox"] {
                margin-right: 8px;
                transform: scale(1.1);
            }
            
            .checkbox-text {
                color: #374151;
                font-weight: 500;
            }
            
            .label-content {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .required-asterisk {
                color: #ef4444;
                font-weight: bold;
            }
            
            .name-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 24px;
                grid-column: span 2;
            }
            
            .state-zip-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                grid-column: span 2;
            }
            
            .city-state-zip-row {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr;
                gap: 24px;
                grid-column: span 2;
            }
            
            .form-subtitle {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1a1a1a;
                margin-bottom: 0.5rem;
            }
            
            .form-subtext {
                color: #666;
                font-size: 0.875rem;
                margin-bottom: 1.5rem;
            }
            
            /* Form Fields */
            .form-label {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
                color: #374151;
            }
            
            /* Tooltip Styles */
            .tooltip-wrapper {
                position: relative;
                display: inline-block;
            }
            
            .label-with-tooltip {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                cursor: help;
            }
            
            .info-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                background: #3b82f6;
                color: white;
                border-radius: 50%;
                font-size: 12px;
                font-weight: bold;
                cursor: help;
                user-select: none;
                margin-left: 6px;
            }
            
            .tooltip-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                background: #3b82f6;
                color: white;
                border-radius: 50%;
                font-size: 12px;
                font-weight: bold;
                cursor: help;
                user-select: none;
                margin-left: 12px;
            }
            
            .tooltip-content {
                background: #1f2937;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                line-height: 1.4;
                max-width: 250px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                word-wrap: break-word;
            }
            
            .tooltip-content::before {
                content: '';
                position: absolute;
                top: 50%;
                left: -5px;
                transform: translateY(-50%);
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 5px 5px 5px 0;
                border-color: transparent #1f2937 transparent transparent;
            }
            
            .form-input {
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s ease;
                background-color: #ffffff;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
            }
            
            .form-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .form-input:disabled {
                background-color: #f9fafb;
                color: #6b7280;
                cursor: not-allowed;
            }
            
            /* Dropdown/Select specific styling */
            select.form-input {
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                padding-right: 50px;
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23666666'%3e%3cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 20px center;
                background-size: 16px 16px;
            }
            
            /* Textarea specific styling */
            textarea.form-input {
                font-size: 14px;
            }
            
            /* Field Validation States */
            .form-input.field-valid {
                border-color: #10b981;
                background-color: #f0fdf4;
            }
            
            .form-input.field-error {
                border-color: #ef4444;
                background-color: #fef2f2;
            }
            
            .field-error-message {
                /* Styling moved to consolidated rule above */
            }
            
            /* Address Validation States */
            .form-input.validation-pending {
                border-color: #f59e0b;
                background-color: #fffbeb;
            }
            
            .form-input.validation-success {
                border-color: #10b981;
                background-color: #f0fdf4;
            }
            
            .form-input.validation-warning {
                border-color: #f59e0b;
                background-color: #fffbeb;
            }
            
            .form-input.validation-error {
                border-color: #ef4444;
                background-color: #fef2f2;
            }
            
            .validation-status {
                font-size: 12px;
                color: #f59e0b;
                margin-top: 4px;
                font-weight: 500;
            }
            
            .validation-loading {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #3b82f6;
            }

            /* International Phone Styles */
            .international-phone-container {
                display: flex;
                border: 2px solid #ddd;
                border-radius: 8px;
                overflow: visible; /* Changed from hidden to visible */
                transition: border-color 0.2s ease;
                background: white;
                height: 48px; /* Match other form inputs */
                position: relative; /* Add positioning context */
            }

            .international-phone-container:focus-within {
                border-color: #007bff;
                box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
            }

            .country-selector {
                position: relative;
                display: flex;
                align-items: center;
                padding: 0 12px;
                background: #f8f9fa;
                border-right: 1px solid #ddd;
                cursor: pointer;
                min-width: 100px;
                user-select: none;
                transition: background-color 0.2s ease;
                height: 100%;
                box-sizing: border-box;
                overflow: visible; /* Ensure dropdown can show */
            }

            .country-selector:hover {
                background: #e9ecef;
            }

            .country-selector .flag {
                font-size: 16px;
                margin-right: 6px;
            }

            .country-selector .dial-code {
                font-size: 14px;
                font-weight: 500;
                color: #333;
                margin-right: 6px;
            }

            .country-selector .dropdown-arrow {
                font-size: 10px;
                color: #666;
                margin-left: auto;
            }

            .country-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                width: 300px; /* Fixed width instead of right: 0 */
                background: white;
                border: 2px solid #007bff; /* Make it more visible for testing */
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                max-height: 250px;
                overflow-y: auto;
                z-index: 9999;
                margin-top: 4px;
            }

            .country-option {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                border-bottom: 1px solid #f1f3f4;
            }

            .country-option:hover {
                background: #f8f9fa;
            }

            .country-option:last-child {
                border-bottom: none;
            }

            .country-option .flag {
                font-size: 16px;
                margin-right: 8px;
                width: 20px;
            }

            .country-option .country-name {
                flex: 1;
                font-size: 14px;
                color: #333;
            }

            .country-option .dial-code {
                font-size: 14px;
                color: #666;
                margin-left: 8px;
            }

            .phone-input {
                flex: 1;
                border: none !important;
                border-radius: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                outline: none !important;
                padding: 0 16px;
                font-size: 16px;
                height: 100%;
                box-sizing: border-box;
            }

            .phone-input:focus {
                outline: none;
                box-shadow: none;
            }
            
            .validation-loading.full-width {
                grid-column: span 2;
                margin-top: 12px;
            }
            
            .loading-spinner {
                width: 12px;
                height: 12px;
                border: 2px solid #e5e7eb;
                border-top: 2px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Address Section */
            .address-section {
                /* Remove background and border styling */
                padding: 0;
                margin: 0;
            }
            
            /* Alert Components */
            .alert {
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                margin-top: 16px;
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }
            
            .alert-success {
                background-color: #f0fdf4;
                color: #166534;
                border: 1px solid #bbf7d0;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .alert-warning {
                background-color: #fffbeb;
                color: #92400e;
                border: 1px solid #fde68a;
            }
            
            .alert-error {
                background-color: #fef2f2;
                color: #991b1b;
                border: 1px solid #fecaca;
            }
            
            .standardization-note {
                font-size: 12px;
                color: #059669;
                margin-top: 4px;
                font-style: italic;
            }
            
            .btn-link {
                background: none;
                border: none;
                color: #3b82f6;
                text-decoration: underline;
                cursor: pointer;
                font-size: 12px;
                margin-left: 8px;
                padding: 0;
            }
            
            .btn-link:hover {
                color: #1d4ed8;
            }
            
            /* Suggestions Dropdown */
            .suggestions-dropdown {
                background: #ffffff;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                margin-top: 16px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                overflow: hidden;
            }
            
            .suggestions-header {
                padding: 16px 20px;
                font-weight: 600;
                color: #374151;
                border-bottom: 1px solid #e5e7eb;
                background-color: #f9fafb;
                font-size: 14px;
            }
            
            .suggestion-item {
                padding: 16px 20px;
                cursor: pointer;
                border-bottom: 1px solid #f3f4f6;
                transition: background-color 0.2s ease;
            }
            
            .suggestion-item:hover {
                background-color: #f8fafc;
            }
            
            .suggestion-item:last-child {
                border-bottom: none;
            }
            
            .suggestion-address {
                font-weight: 500;
                color: #111827;
                margin-bottom: 4px;
            }
            
            .suggestion-location {
                font-size: 13px;
                color: #6b7280;
            }
            
            .keep-original {
                color: #6b7280;
                font-style: italic;
                background-color: #f9fafb;
            }
            
            .keep-original:hover {
                background-color: #f3f4f6;
            }
            
            /* Upload Styles */
            .file-upload-section {
                margin-bottom: 32px;
            }
            
            /* Redesigned Upload Structure */
            .upload-box-redesigned {
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                transition: all 0.2s ease;
                background-color: #fafafa;
                cursor: pointer;
                position: relative;
                margin-bottom: 20px;
                min-height: auto;
            }
            
            .upload-box-redesigned:hover {
                border-color: #3b82f6;
                background-color: #f8fafc;
            }
            
            .upload-box-redesigned.has-files {
                border-color: #10b981;
                background-color: #f0fdf4;
            }
            
            .upload-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .upload-icon-redesigned {
                color: #6b7280;
            }
            
            .upload-text-redesigned {
                color: #3b82f6;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .upload-text-redesigned strong {
                display: block;
                margin-bottom: 4px;
                font-weight: 600;
            }
            
            .upload-text-redesigned span {
                font-size: 12px;
            }
            
            .files-preview-embedded {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
            }
            
            .files-header {
                font-size: 13px;
                font-weight: 500;
                color: #10b981;
                margin-bottom: 12px;
            }
            
            .files-grid-embedded {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
            }
            
            .file-chip {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                padding: 4px 8px 4px 4px;
                font-size: 12px;
                color: #374151;
                max-width: 150px;
            }
            
            .file-chip-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
            }
            
            .file-chip-thumb.pdf-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fef2f2;
                font-size: 10px;
            }
            
            .file-chip-name {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                min-width: 0;
            }
            
            .file-chip-remove {
                background: none;
                color: #6b7280;
                border: none;
                width: 16px;
                height: 16px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                line-height: 1;
                transition: color 0.2s;
            }
            
            .file-chip-remove:hover {
                color: #ef4444;
            }
            .upload-section-title {
                font-weight: 600;
                color: #374151;
                font-size: 18px;
                margin-bottom: 12px;
            }
            
            .upload-container {
                display: flex;
                gap: 16px;
                align-items: flex-start;
                margin-bottom: 20px;
            }
            
            .upload-box-compact {
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                transition: all 0.2s ease;
                background-color: #fafafa;
                cursor: pointer;
                position: relative;
                min-width: 240px;
                flex-shrink: 0;
            }
            
            .upload-box-compact:hover {
                border-color: #3b82f6;
                background-color: #f8fafc;
            }
            
            .upload-box-compact.has-files {
                border-color: #10b981;
                background-color: #f0fdf4;
            }
            
            .upload-icon-small {
                margin-bottom: 8px;
                color: #6b7280;
                display: flex;
                justify-content: center;
            }
            
            .upload-text-compact {
                color: #3b82f6;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .upload-text-compact strong {
                display: block;
                margin-bottom: 4px;
                font-weight: 600;
            }
            
            .file-previews-inline {
                flex: 1;
                min-width: 0;
            }
            
            .files-count {
                font-weight: 500;
                color: #10b981;
                margin-bottom: 6px;
                font-size: 13px;
            }
            
            .file-list-compact {
                display: flex;
                flex-direction: column;
                gap: 4px;
                max-height: 120px;
                overflow-y: auto;
            }
            
            .file-item-compact {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 8px;
                background: #f8f9fa;
                border-radius: 4px;
                border: 1px solid #e5e7eb;
                min-height: 32px;
            }
            
            .file-thumb-small {
                width: 24px;
                height: 24px;
                border-radius: 3px;
                object-fit: cover;
                flex-shrink: 0;
            }
            
            .file-thumb-small.pdf-thumb {
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fee2e2;
                font-size: 12px;
            }
            
            .file-details-compact {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-width: 0;
            }
            
            .file-name-short {
                font-size: 12px;
                color: #374151;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-right: 8px;
            }
            
            .remove-file-btn-small {
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: background-color 0.2s;
                line-height: 1;
            }
            
            .remove-file-btn-small:hover {
                background: #dc2626;
            }
            
            /* Legacy styles - keeping for compatibility */
            .upload-box {
                border: 2px dashed #d1d5db;
                border-radius: 12px;
                padding: 32px 24px;
                margin-bottom: 20px;
                text-align: center;
                transition: all 0.2s ease;
                background-color: #fafafa;
                cursor: pointer;
                position: relative;
            }
            
            .upload-box:hover {
                border-color: #3b82f6;
                background-color: #f8fafc;
            }
            
            .upload-box.has-files {
                border-color: #10b981;
                background-color: #f0fdf4;
            }
            
            .upload-icon {
                font-size: 32px;
                margin-bottom: 12px;
                color: #6b7280;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 12px auto;
            }
            
            .upload-content {
                text-align: center;
            }
            
            .upload-label {
                font-weight: 600;
                margin: 0 0 24px 0;
                display: block;
                color: #374151;
                font-size: 18px;
            }
            
            .upload-note {
                font-size: 14px;
                color: #3b82f6;
                margin: 0;
                line-height: 1.5;
            }
            
            .upload-note strong {
                display: block;
                margin-bottom: 8px;
                color: #3b82f6;
                font-weight: 600;
            }
            
            .upload-input {
                position: absolute;
                left: -9999px;
                opacity: 0;
                pointer-events: none;
            }
            
            .uploaded-files {
                background: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin-top: 16px;
            }
            
            .uploaded-files h4 {
                margin: 0 0 16px 0;
                color: #374151;
                font-size: 14px;
                font-weight: 600;
            }
            
            .file-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 16px;
            }
            
            .file-preview {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position: relative;
            }
            
            .file-thumbnail {
                width: 100%;
                height: 120px;
                object-fit: cover;
                display: block;
            }
            
            .pdf-thumbnail {
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                background-color: #f3f4f6;
                color: #6b7280;
                border: 2px dashed #d1d5db;
            }
            
            .file-info {
                padding: 12px;
                position: relative;
            }
            
            .file-name {
                display: block;
                font-weight: 500;
                font-size: 12px;
                color: #374151;
                margin-bottom: 4px;
                word-break: break-word;
            }
            
            .file-size {
                display: block;
                font-size: 11px;
                color: #6b7280;
            }
            
            .remove-file-btn {
                position: absolute;
                bottom: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                border-radius: 0;
                background: transparent;
                color: #374151;
                border: none;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .remove-file-btn:hover {
                color: #ef4444;
                transform: scale(1.2);
            }
            
            /* Guidelines Section */
            .guidelines-section {
                padding: 24px 0;
                margin-top: 32px;
            }
            
            .guidelines-title {
                color: #374151;
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 16px 0;
            }
            
            .guidelines-list {
                margin: 0 0 24px 0;
                padding: 0 0 0 20px;
                color: #4b5563;
                line-height: 1.6;
            }
            
            .guidelines-list li {
                margin-bottom: 12px;
                font-size: 14px;
            }
            
            .guidelines-link {
                color: #3b82f6;
                text-decoration: underline;
            }
            
            .guidelines-link:hover {
                color: #1d4ed8;
            }
            
            .guidelines-image {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .example-photos {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            /* Radio Groups */
            .radio-group {
                margin-bottom: 32px;
            }
            
            .radio-label {
                display: flex;
                align-items: flex-start;
                margin-bottom: 16px;
                padding: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .radio-label:hover {
                border-color: #3b82f6;
                background-color: #f8fafc;
            }
            
            .radio-label input[type="radio"] {
                margin-right: 12px;
                margin-top: 2px;
            }
            
            .radio-sub {
                font-size: 14px;
                color: #6b7280;
                margin-top: 4px;
            }
            
            /* Summary Box */
            .summary-box {
                background-color: #f8fafc;
                padding: 24px;
                border-radius: 12px;
                margin-bottom: 32px;
                border: 2px solid #e2e8f0;
            }
            
            .summary-title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 16px;
                color: #374151;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                font-size: 15px;
                margin-bottom: 8px;
                color: #4b5563;
            }
            
            .summary-row.subtotal {
                font-weight: 600;
                padding-top: 12px;
                border-top: 1px solid #e5e7eb;
                margin-top: 12px;
            }
            
            .summary-row.total {
                font-weight: 700;
                font-size: 16px;
                margin-top: 16px;
                padding-top: 16px;
                border-top: 2px solid #e5e7eb;
                color: #111827;
            }
            
            /* Buttons */
            .button-row {
                display: flex;
                justify-content: space-between;
                gap: 16px;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 2px solid #f3f4f6;
            }
            
            .btn {
                padding: 12px 24px;
                border: 2px solid transparent;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.2s ease;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .btn.primary {
                background-color: #3b82f6;
                color: white;
            }
            
            .btn.primary:hover:not(:disabled) {
                background-color: #2563eb;
                transform: translateY(-1px);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .btn:not(.primary) {
                background-color: #ffffff;
                color: #374151;
                border-color: #d1d5db;
            }
            
            .btn:not(.primary):hover {
                background-color: #f9fafb;
                border-color: #9ca3af;
            }
            
            /* Responsive Design */
            /* Checkbox Groups */
            .checkbox-group {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                gap: 24px;
                margin-top: 8px;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: background-color 0.2s ease;
            }
            
            .checkbox-label:hover {
                background-color: #f8fafc;
            }
            
            .checkbox-label input[type="checkbox"] {
                width: 18px;
                height: 18px;
                accent-color: #3b82f6;
                cursor: pointer;
            }
            
            .checkbox-text {
                font-size: 14px;
                color: #374151;
                font-weight: 500;
            }
            
            .form-field {
                display: flex;
                flex-direction: column;
                margin-bottom: 0; /* Remove margin, let error space handle it */
            }
            
            .error-space {
                height: 12px; /* Fixed height - always takes same space */
                margin-top: 4px;
                display: flex;
                align-items: flex-start;
            }
            
            .field-error-message,
            .error-message {
                font-size: 12px;
                color: #ef4444;
                font-weight: 500;
                line-height: 16px;
            }
            
            .checkout-error {
                margin-top: 12px;
                padding: 12px;
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 6px;
                text-align: center;
            }
            
            .form-field.full-width {
                grid-column: span 2;
                margin-bottom: 24px;
            }
            
            .license-types-section {
                margin-top: 32px;
            }
            
            .field-label {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
                color: #374151;
            }
            
            .field-with-inline-note {
                position: relative;
            }
            
            .field-with-inline-note input {
                width: 100%;
            }
            
            .label-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .label-row .form-label {
                margin-bottom: 0;
            }
            
            .field-note-inline {
                font-size: 12px;
                color: #6b7280;
                font-style: italic;
            }
            
            .field-with-note {
                position: relative;
            }
            
            .field-note-right {
                font-size: 12px;
                color: #6b7280;
                margin: 0 0 4px 0;
                text-align: right;
                font-style: italic;
            }
            
            .field-note {
                font-size: 12px;
                color: #6b7280;
                margin: 4px 0 16px 0;
                font-style: italic;
            }
            
            .required-asterisk {
                color: #ef4444;
            }
            
            /* Error message styling consolidated above */
            
            @media (max-width: 768px) {
                /* Global mobile layout override - force everything to single column */
                .form-grid,
                .name-row,
                .state-zip-row,
                .city-state-zip-row,
                [class*="grid"]:not(.checkbox-grid):not(.license-grid),
                [class*="row"]:not(.button-row) {
                    grid-template-columns: 1fr !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 16px !important;
                }
                
                .container {
                    padding: 0 12px;
                }
                
                .form-container {
                    padding: 20px 16px;
                    border-radius: 12px;
                    margin: 16px 0;
                }
                
                .form-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .name-row {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .form-group.full-width {
                    grid-column: span 1;
                }
                
                .stepper {
                    padding: 0 8px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                }
                
                .step {
                    margin-bottom: 8px;
                }
                
                .step .label {
                    font-size: 10px;
                    max-width: 80px;
                    text-align: center;
                    line-height: 1.2;
                }
                
                .circle {
                    width: 28px;
                    height: 28px;
                    font-size: 12px;
                }
                
                .button-row {
                    flex-direction: row;
                    gap: 12px;
                    margin-top: 24px;
                    padding-top: 20px;
                    justify-content: space-between;
                }
                
                .btn {
                    flex: 1;
                    max-width: calc(50% - 6px);
                    padding: 14px 20px;
                    font-size: 16px;
                }
                
                .form-input, .form-select {
                    padding: 14px 16px;
                    font-size: 16px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                    width: 100%;
                }
                
                .form-grid {
                    grid-template-columns: 1fr !important;
                    gap: 16px;
                    width: 100%;
                }
                
                .name-row {
                    grid-template-columns: 1fr !important;
                    gap: 16px;
                    width: 100%;
                }
                
                .state-zip-row {
                    grid-template-columns: 1fr !important;
                    gap: 16px;
                    width: 100%;
                }
                
                .city-state-zip-row {
                    grid-template-columns: 1fr !important;
                    gap: 16px;
                    width: 100%;
                }
                
                /* Force all grid layouts to single column */
                .form-section [class*="grid"],
                .form-section [class*="row"] {
                    grid-template-columns: 1fr !important;
                    gap: 16px !important;
                }
                
                /* Ensure proper field width on mobile */
                .form-input, .form-select, input, select, textarea {
                    width: 100% !important;
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                /* Fix inline field layout issues */
                .label-row {
                    display: block;
                }
                
                .field-note-inline {
                    display: block;
                    margin-top: 4px;
                    font-size: 12px;
                    color: #6b7280;
                    font-style: italic;
                }
                
                .signature-container canvas,
                .signature-canvas {
                    max-width: 100% !important;
                    width: 100% !important;
                    height: 120px !important;
                    border-radius: 6px !important;
                    touch-action: none !important;
                    user-select: none !important;
                }
                
                .signature-field {
                    grid-column: span 1 !important;
                    margin-top: 16px;
                    width: 100% !important;
                }
                
                .signature-container {
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                .signature-container button {
                    width: 100%;
                    padding: 12px 16px;
                    margin-top: 12px;
                }
                
                .tooltip-content {
                    max-width: 280px;
                    font-size: 12px;
                    padding: 6px 10px;
                }
            }
            
            @media (max-width: 480px) {
                .container {
                    padding: 0 8px;
                }
                
                .form-container {
                    padding: 16px 12px;
                    border-radius: 8px;
                    margin: 12px 0;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .section-title {
                    font-size: 18px;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                }
                
                .form-subtitle {
                    font-size: 15px;
                    margin-bottom: 16px;
                }
                
                .form-input, .form-select {
                    font-size: 16px; /* Prevents zoom on iOS */
                    padding: 16px 14px;
                    border-radius: 8px;
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                .form-label {
                    font-size: 14px;
                    margin-bottom: 6px;
                }
                
                /* Force ALL grid layouts to single column on small mobile */
                .form-grid,
                .name-row,
                .state-zip-row,
                .city-state-zip-row,
                .form-section [class*="grid"],
                .form-section [class*="row"] {
                    grid-template-columns: 1fr !important;
                    gap: 16px !important;
                    display: block !important;
                }
                
                .form-section [class*="grid"] > *,
                .form-section [class*="row"] > * {
                    margin-bottom: 16px !important;
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                .stepper {
                    margin-bottom: 20px;
                    padding: 0 4px;
                }
                
                .step {
                    flex: 1;
                    min-width: 0;
                }
                
                .step:not(:last-child)::after {
                    display: none; /* Hide connecting lines on mobile */
                }
                
                .step .label {
                    font-size: 9px;
                    margin-top: 4px;
                    overflow-wrap: break-word;
                    hyphens: auto;
                }
                
                .circle {
                    width: 24px;
                    height: 24px;
                    font-size: 11px;
                }
                
                .btn {
                    padding: 16px 20px;
                    font-size: 16px;
                    border-radius: 8px;
                    min-height: 48px;
                }
                
                .field-error-message, .error-message {
                    font-size: 11px;
                }
                
                .checkbox-label {
                    padding: 12px 8px;
                    gap: 8px;
                }
                
                .checkbox-text {
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .info-icon, .tooltip-icon {
                    width: 14px;
                    height: 14px;
                    font-size: 10px;
                    margin-left: 8px;
                }
                
                .signature-container canvas,
                .signature-canvas {
                    height: 100px !important;
                    border-radius: 6px !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    touch-action: none !important;
                }
                
                .signature-container button {
                    width: 100%;
                    padding: 14px 16px;
                    margin-top: 12px;
                    font-size: 14px;
                }
                
                .file-upload-area {
                    padding: 16px 12px;
                    border-radius: 6px;
                }
                
                .file-upload-text {
                    font-size: 13px;
                }
                
                .upload-hint {
                    font-size: 11px;
                }
            }
            
            /* Extra small mobile devices */
            @media (max-width: 360px) {
                .container {
                    padding: 0 8px;
                    width: 100%;
                    max-width: 100%;
                    overflow-x: hidden;
                }
                
                .form-container {
                    padding: 12px 8px;
                    margin: 8px 0;
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                }
                
                .section-title {
                    font-size: 16px;
                    margin-bottom: 16px;
                    padding-bottom: 8px;
                }
                
                .form-input, .form-select {
                    padding: 14px 12px;
                    font-size: 16px;
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                /* Ensure absolute single column layout on extra small screens */
                .form-grid,
                .name-row,
                .state-zip-row,
                .city-state-zip-row,
                .form-section [class*="grid"],
                .form-section [class*="row"],
                [class*="grid"],
                [class*="row"] {
                    grid-template-columns: 1fr !important;
                    gap: 12px !important;
                    display: block !important;
                }
                
                .form-section > *,
                .form-group,
                [class*="grid"] > *,
                [class*="row"] > * {
                    margin-bottom: 12px !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    display: block !important;
                }
                
                .btn {
                    padding: 14px 16px;
                    font-size: 15px;
                }
                
                .circle {
                    width: 22px;
                    height: 22px;
                    font-size: 10px;
                }
                
                .step .label {
                    font-size: 8px;
                }
                
                .stepper {
                    padding: 0 2px;
                    margin-bottom: 16px;
                }
                
                .info-icon, .tooltip-icon {
                    width: 12px;
                    height: 12px;
                    font-size: 9px;
                    margin-left: 6px;
                }
                
                .tooltip-content {
                    max-width: 240px;
                    font-size: 11px;
                    padding: 4px 8px;
                }
            }

            /* Payment Styles - Clean and consistent */
            .payment-form-container {
                width: 100%;
            }

            .payment-form {
                width: 100%;
            }

            .summary-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
                font-size: 15px;
                color: #4b5563;
                line-height: 1.4;
            }

            .summary-row.total {
                font-weight: 700;
                font-size: 16px;
                margin-top: 16px;
                padding-top: 16px;
                border-top: 2px solid #e5e7eb;
                color: #111827;
            }

            .summary-amount {
                font-weight: 600;
                color: #111827;
                white-space: nowrap;
            }

            .loading-message {
                text-align: center;
                color: #666;
                font-size: 14px;
                padding: 10px;
                font-style: italic;
            }

            .debug-info {
                margin-top: 16px;
                font-size: 12px;
                color: #6b7280;
            }

            .debug-info summary {
                cursor: pointer;
                padding: 4px 0;
            }

            .debug-content {
                padding: 8px 12px;
                background: #f8f9fa;
                border-radius: 4px;
                margin-top: 4px;
                border: 1px solid #e5e7eb;
                line-height: 1.4;
            }

            /* Classic Processing & Shipping Styles */
            .processing-shipping-classic {
                max-width: 800px;
                margin: 0 auto;
                padding: 0 20px;
            }
            
            .pricing-info-message {
                background-color: #f0f8ff;
                border: 1px solid #b8daff;
                border-radius: 6px;
                padding: 16px;
                margin-bottom: 24px;
                text-align: center;
            }
            
            .pricing-info-message p {
                margin: 0;
                color: #0c5aa6;
                font-size: 14px;
                font-weight: 500;
            }
            .classic-field {
                margin-bottom: 18px;
            }
            
            .subtitle-note {
                font-size: 13px;
                color: #6b7280;
                margin-top: 4px;
                margin-bottom: 12px;
            }
            
            /* International Address Fields Styling */
            .international-address-fields {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-top: 8px;
                padding: 20px;
                background-color: #fafbfc;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
            }
            
            .international-address-fields .form-group {
                margin-bottom: 0;
            }
            
            .international-address-fields .form-label {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 6px;
                display: block;
            }
            
            .international-address-fields textarea {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                font-size: 14px;
                font-family: inherit;
                line-height: 1.4;
                resize: vertical;
                transition: border-color 0.2s ease;
                background-color: #ffffff;
            }
            
            .international-address-fields textarea:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .international-address-fields textarea::placeholder {
                color: #9ca3af;
                font-size: 13px;
            }
            
            /* Custom Address Fields Styling */
            .custom-address-fields {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .custom-address-fields .form-group {
                margin-bottom: 0;
            }
            
            .custom-address-fields .form-label {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 6px;
                display: block;
            }
            
            .custom-address-fields input,
            .custom-address-fields select {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                font-size: 14px;
                font-family: inherit;
                transition: border-color 0.2s ease;
                background-color: #ffffff;
            }
            
            .custom-address-fields input:focus,
            .custom-address-fields select:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .address-row {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr;
                gap: 16px;
            }
            
            @media (max-width: 768px) {
                .address-row {
                    grid-template-columns: 1fr;
                }
            }
            
            .classic-label {
                display: block;
                font-size: 15px;
                font-weight: 600;
                color: #222;
                margin-bottom: 4px;
            }
            .classic-radio-group {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .classic-radio {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 24px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: #ffffff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                position: relative;
            }
            .classic-radio:hover {
                border-color: #3b82f6;
                background-color: #f8faff;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
                transform: translateY(-1px);
            }
            .classic-radio input[type="radio"] {
                width: 20px;
                height: 20px;
                margin-right: 16px;
                flex-shrink: 0;
                cursor: pointer;
                accent-color: #3b82f6;
            }
            .classic-radio input[type="radio"]:checked {
                border-color: #3b82f6;
            }
            .classic-radio input[type="radio"]:checked + .classic-radio-content .classic-radio-label {
                color: #1f2937;
                font-weight: 600;
            }
            .classic-radio input[type="radio"]:checked ~ .classic-radio-price {
                color: #3b82f6;
                font-weight: 700;
            }
            .classic-radio-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .classic-radio-label {
                font-size: 16px;
                font-weight: 500;
                color: #374151;
                line-height: 1.4;
                margin: 0;
            }
            .classic-radio-sub {
                font-size: 14px;
                color: #6b7280;
                font-weight: 400;
                line-height: 1.3;
                margin: 0;
            }
            .classic-radio-price {
                font-size: 20px;
                font-weight: 600;
                color: #059669;
                margin-left: 24px;
                flex-shrink: 0;
                text-align: right;
                min-width: 80px;
            }
            .classic-radio input[type="radio"]:focus {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            /* Horizontal shipping category layout */
            .shipping-category-horizontal {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 16px;
            }
            
            .horizontal-radio {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 20px 16px;
                min-height: 100px;
                justify-content: center;
            }
            
            .horizontal-radio input[type="radio"] {
                margin: 0 0 12px 0;
                width: 18px;
                height: 18px;
            }
            
            .horizontal-radio .classic-radio-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }
            
            .horizontal-radio .classic-radio-label {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }
            
            .horizontal-radio .classic-radio-sub {
                font-size: 13px;
                margin: 0;
            }
            
            /* Mobile responsive - stack vertically */
            @media (max-width: 768px) {
                .shipping-category-horizontal {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .horizontal-radio {
                    flex-direction: row;
                    justify-content: flex-start;
                    text-align: left;
                    padding: 16px;
                    min-height: auto;
                }
                
                .horizontal-radio input[type="radio"] {
                    margin: 0 12px 0 0;
                    width: 16px;
                    height: 16px;
                }
                
                .horizontal-radio .classic-radio-content {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 2px;
                }
            }
            
            /* Selectable box styles */
            .selectable-box-group {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 16px;
            }
            
            .selectable-box {
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                min-height: 100px;
                justify-content: center;
                position: relative;
            }
            
            .selectable-box:hover {
                border-color: #3b82f6;
                background-color: #f8fafc;
            }
            
            .selectable-box.selected {
                border-color: #3b82f6;
                background-color: #eff6ff;
                box-shadow: 0 0 0 1px #3b82f6;
            }
            
            .selectable-box-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }
            
            .selectable-box-label {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
                color: #1f2937;
            }
            
            .selectable-box-sub {
                font-size: 13px;
                margin: 0;
                color: #6b7280;
            }
            
            .selectable-box-price {
                font-size: 18px;
                font-weight: 700;
                color: #08477D;
                margin-top: 8px;
            }
            
            .selectable-box input[type="radio"] {
                position: absolute;
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            /* Vertical layout for processing speed and shipping speed */
            .selectable-box-group.vertical {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .selectable-box-group.vertical .selectable-box {
                flex-direction: row;
                justify-content: space-between;
                text-align: left;
                min-height: auto;
                padding: 16px 20px;
            }
            
            .selectable-box-group.vertical .selectable-box-content {
                flex-direction: column;
                align-items: flex-start;
                gap: 2px;
            }
            
            .selectable-box-group.vertical .selectable-box-price {
                margin-top: 0;
                font-size: 18px;
            }
            
            /* Mobile responsive for selectable boxes */
            @media (max-width: 768px) {
                .selectable-box-group {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .selectable-box {
                    flex-direction: row;
                    justify-content: space-between;
                    text-align: left;
                    min-height: auto;
                    padding: 16px;
                }
                
                .selectable-box-content {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 2px;
                }
                
                .selectable-box-price {
                    margin-top: 0;
                    font-size: 16px;
                }
            }
            .classic-radio input[type="radio"]:checked {
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            }
            @media (max-width: 600px) {
                .processing-shipping-classic {
                    max-width: 100%;
                    padding: 0 8px;
                }
                .classic-label {
                    font-size: 14px;
                }
                .classic-radio {
                    padding: 16px 20px;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
                .classic-radio input[type="radio"] {
                    margin-right: 0;
                    margin-bottom: 8px;
                }
                .classic-radio-content {
                    width: 100%;
                }
                .classic-radio-price {
                    margin-left: 0;
                    text-align: left;
                    font-size: 18px;
                }
            }
            }

            /* Sleek Processing & Shipping Styles */
            .processing-shipping-sleek {
                max-width: 520px;
                margin: 0 auto;
                padding: 0 4px;
            }
            .sleek-fields {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .sleek-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 0;
                flex-wrap: wrap;
            }
            .sleek-label {
                min-width: 120px;
                font-size: 15px;
                font-weight: 600;
                color: #222;
                margin-right: 8px;
            }
            .sleek-radio-group {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }
            .sleek-radio {
                display: flex;
                align-items: center;
                border: 1.5px solid #e0e0e0;
                border-radius: 6px;
                padding: 4px 10px 4px 6px;
                font-size: 15px;
                cursor: pointer;
                min-width: 80px;
                background: #fff;
                transition: border 0.18s, background 0.18s;
                position: relative;
                gap: 4px;
            }
            .sleek-radio.selected {
                border: 2px solid #007bff;
                background: #f3f8ff;
            }
            .sleek-radio input[type="radio"] {
                margin-right: 4px;
            }
            .sleek-radio-label {
                font-weight: 500;
                color: #222;
                margin-right: 2px;
            }
            .sleek-radio-price {
                font-size: 14px;
                color: #007bff;
                font-weight: 600;
                margin-left: 2px;
            }
            .sleek-radio-sub {
                font-size: 12px;
                color: #888;
                margin-left: 4px;
            }
            @media (max-width: 600px) {
                .processing-shipping-sleek {
                    max-width: 100%;
                    padding: 0 2px;
                }
                .sleek-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 2px;
                }
                .sleek-label {
                    margin-bottom: 2px;
                }
                .sleek-radio-group {
                    width: 100%;
                }
                .sleek-radio {
                    min-width: 0;
                    width: 100%;
                    padding: 6px 8px;
                }
            }
            }

            /* Condensed Processing & Shipping Styles */
            .processing-shipping-condensed {
                max-width: 600px;
                margin: 0 auto;
                padding: 0 8px;
            }
            .condensed-fields {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .condensed-group {
                margin-bottom: 0;
            }
            .condensed-label {
                font-size: 15px;
                font-weight: 600;
                margin-bottom: 4px;
                display: block;
                color: #222;
            }
            .condensed-radio-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .condensed-radio {
                display: flex;
                align-items: center;
                background: #f7f7f7;
                border: 1.5px solid #e0e0e0;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 15px;
                cursor: pointer;
                min-width: 90px;
                transition: border 0.2s, background 0.2s;
                position: relative;
                gap: 6px;
            }
            .condensed-radio.selected {
                border: 2px solid #007bff;
                background: #eaf4ff;
            }
            .condensed-radio input[type="radio"] {
                margin-right: 6px;
            }
            .condensed-radio-label {
                font-weight: 500;
                color: #222;
            }
            .condensed-radio-price {
                font-size: 14px;
                color: #007bff;
                font-weight: 600;
                margin-left: 2px;
            }
            .condensed-radio-sub {
                font-size: 12px;
                color: #888;
                margin-left: 4px;
            }
            @media (max-width: 600px) {
                .processing-shipping-condensed {
                    max-width: 100%;
                    padding: 0 2px;
                }
                .condensed-radio-row {
                    flex-direction: column;
                    gap: 4px;
                }
                .condensed-radio {
                    min-width: 0;
                    width: 100%;
                    padding: 8px 8px;
                }
            }
            }

            .payment-success {
                text-align: center;
                padding: 40px 20px;
                background: #f8f9fa;
                border-radius: 12px;
                margin: 20px 0;
            }

            .success-icon {
                width: 80px;
                height: 80px;
                background: #28a745;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                font-weight: bold;
                margin: 0 auto 20px;
            }

            .payment-success h3 {
                color: #28a745;
                margin-bottom: 15px;
            }

            .payment-success p {
                margin-bottom: 10px;
                color: #6c757d;
            }

            .payment-loading {
                text-align: center;
                padding: 40px 20px;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #0066cc;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .payment-error {
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
            }

            .payment-submit-button {
                width: 100%;
                padding: 16px;
                background: #0066cc;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 20px;
                transition: all 0.2s ease;
            }

            .payment-submit-button:hover:not(:disabled) {
                background: #0056b3;
                transform: translateY(-1px);
            }

            .payment-submit-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .payment-error {
                color: #dc3545;
                font-size: 14px;
                margin-top: 10px;
                text-align: left;
            }

            /* Modern Processing & Shipping Styles */
            .processing-shipping-container {
                max-width: 800px;
                margin: 0 auto;
            }

            .section-card {
                background: white;
                border-radius: 16px;
                padding: 32px;
                margin-bottom: 32px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                border: 1px solid #f0f0f0;
                transition: all 0.3s ease;
            }

            .section-card:hover {
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            }

            .section-header {
                margin-bottom: 28px;
                text-align: center;
            }

            .section-subtitle {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                font-size: 24px;
                font-weight: 700;
                color: #1a1a1a;
                margin: 0 0 8px 0;
            }

            .step-number {
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: 600;
            }

            .section-description {
                color: #666;
                font-size: 16px;
                margin: 0;
                max-width: 500px;
                margin: 0 auto;
            }

            /* Processing Options Grid */
            .modern-options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
            }

            .option-card {
                background: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 12px;
                padding: 24px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .option-card:hover {
                border-color: #007bff;
                background: #f0f8ff;
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
            }

            .option-card.selected {
                border-color: #007bff;
                background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                box-shadow: 0 8px 25px rgba(0, 123, 255, 0.2);
            }

            .option-icon {
                font-size: 32px;
                margin-bottom: 16px;
                display: block;
            }

            .option-content {
                flex: 1;
            }

            .option-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
            }

            .option-title {
                font-size: 20px;
                font-weight: 600;
                color: #1a1a1a;
                margin: 0;
            }

            .option-price {
                font-size: 24px;
                font-weight: 700;
                color: #007bff;
            }

            .option-duration {
                font-size: 16px;
                color: #007bff;
                font-weight: 500;
                margin: 4px 0 8px 0;
            }

            .option-description {
                font-size: 14px;
                color: #666;
                margin: 0;
            }

            .hidden-radio {
                display: none;
            }

            .selection-indicator {
                position: absolute;
                top: 16px;
                right: 16px;
                opacity: 0;
                transition: all 0.3s ease;
            }

            .option-card.selected .selection-indicator {
                opacity: 1;
            }

            .checkmark {
                background: #007bff;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
            }

            /* Category Selector */
            .category-selector {
                display: grid;
                gap: 16px;
            }

            .category-card {
                background: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 12px;
                padding: 24px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .category-card:hover {
                border-color: #007bff;
                background: #f0f8ff;
                transform: translateX(4px);
            }

            .category-card.selected {
                border-color: #007bff;
                background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                box-shadow: 0 4px 15px rgba(0, 123, 255, 0.15);
            }

            .category-icon {
                font-size: 48px;
                flex-shrink: 0;
            }

            .category-content {
                flex: 1;
            }

            .category-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 4px;
            }

            .category-title {
                font-size: 20px;
                font-weight: 600;
                color: #1a1a1a;
                margin: 0;
            }

            .popular-badge {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .category-subtitle {
                font-size: 16px;
                color: #007bff;
                font-weight: 500;
                margin: 0 0 4px 0;
            }

            .category-description {
                font-size: 14px;
                color: #666;
                margin: 0;
            }

            /* Shipping Speed Options */
            .shipping-speed-section {
                animation: slideInUp 0.5s ease-out;
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .shipping-options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
            }

            .shipping-option-card {
                background: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .shipping-option-card:hover {
                border-color: #007bff;
                background: #f0f8ff;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.15);
            }

            .shipping-option-card.selected {
                border-color: #007bff;
                background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.2);
            }

            .shipping-icon {
                font-size: 32px;
                flex-shrink: 0;
            }

            .shipping-content {
                flex: 1;
            }

            .shipping-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
                flex-wrap: wrap;
            }

            .shipping-title {
                font-size: 18px;
                font-weight: 600;
                color: #1a1a1a;
                margin: 0;
            }

            .shipping-price {
                font-size: 20px;
                font-weight: 700;
                color: #007bff;
            }

            .savings-badge {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 3px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .shipping-duration {
                font-size: 14px;
                color: #666;
                margin: 0;
            }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                /* Prevent horizontal scrolling */
                body {
                    overflow-x: hidden;
                }
                
                /* Global mobile layout override - force everything to single column */
                .form-grid,
                .name-row,
                .state-zip-row,
                .city-state-zip-row,
                [class*="grid"]:not(.checkbox-grid):not(.license-grid),
                [class*="row"]:not(.button-row) {
                    grid-template-columns: 1fr !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 16px !important;
                }
                
                .container {
                    padding: 0 12px;
                    width: 100%;
                    max-width: 100%;
                    overflow-x: hidden;
                }
                
                .form-container {
                    padding: 20px 16px;
                    border-radius: 12px;
                    margin: 16px 0;
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                }
                
                .form-grid {
                    grid-template-columns: 1fr !important;
                    gap: 16px;
                    width: 100%;
                }
                
                .form-group.full-width {
                    grid-column: span 1;
                    width: 100%;
                }
                
                .form-group {
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                /* Better input styling for mobile */
                .form-input, .form-select {
                    width: 100% !important;
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                    font-size: 16px !important; /* Prevent iOS zoom */
                    padding: 14px 16px !important;
                    border-radius: 8px !important;
                }
                
                .section-card {
                    padding: 24px 20px;
                    margin-bottom: 24px;
                }

                .modern-options-grid {
                    grid-template-columns: 1fr;
                }

                .category-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 16px;
                }

                .category-icon {
                    font-size: 40px;
                }

                .shipping-options-grid {
                    grid-template-columns: 1fr;
                }

                .shipping-option-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 12px;
                }

                .section-subtitle {
                    font-size: 20px;
                }

                .section-description {
                    font-size: 14px;
                }
            }

            @media (max-width: 480px) {
                .processing-shipping-container {
                    padding: 0 10px;
                }

                .section-card {
                    padding: 20px 16px;
                    border-radius: 12px;
                }

                .option-card {
                    padding: 20px;
                }

                .category-card {
                    padding: 20px;
                }

                .shipping-option-card {
                    padding: 16px;
                }
            }
        `}</style>
        </div>
    )
}
