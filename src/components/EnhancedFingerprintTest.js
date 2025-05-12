import React, { useEffect, useState, useRef } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import Fingerprint2 from 'fingerprintjs2';

const EnhancedFingerprintTest = () => {
    const [visitorId, setVisitorId] = useState('');
    const [componentsData, setComponentsData] = useState(null);
    const [storageInfo, setStorageInfo] = useState({
        localStorage: { used: 0, remaining: 'N/A' },
        sessionStorage: { used: 0, remaining: 'N/A' },
        quota: { used: 0, granted: 0, remaining: 0 }
    });
    const [componentFingerprints, setComponentFingerprints] = useState({
        fonts: '',
        canvas: '',
        webgl: '',
        audio: '',
        speech: '',
        render: '',
        // Add more if you decide to hash specific groups of FingerprintJS components
    });
    const [loading, setLoading] = useState(true);
    const renderTestRef = useRef(null);

    // Helper to hash an array of values or a complex object
    const calculateHash = (data) => {
        if (!data) return '';
        const stringToHash = typeof data === 'string' ? data : JSON.stringify(data);
        return Fingerprint2.x64hash128(stringToHash, 31);

    };

    // Get detailed render test data
    const getRenderTestData = () => {
        const testElement = renderTestRef.current;
        if (!testElement) return '';

        const styles = window.getComputedStyle(testElement);
        const rect = testElement.getBoundingClientRect(); // More precise dimensions

        const renderData = {
            // Text
            textRendering: styles.textRendering,
            fontSmoothing: styles.webkitFontSmoothing || styles.mozOsxFontSmoothing,
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            letterSpacing: styles.letterSpacing,
            lineHeight: styles.lineHeight,
            // Color
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            opacity: styles.opacity,
            // Layout
            boxSizing: styles.boxSizing,
            display: styles.display,
            position: styles.position,
            width: styles.width, // computed width
            height: styles.height, // computed height
            offsetWidth: testElement.offsetWidth, // actual rendered width
            offsetHeight: testElement.offsetHeight,
            clientWidth: testElement.clientWidth,
            clientHeight: testElement.clientHeight,
            rectWidth: rect.width,
            rectHeight: rect.height,
            // Transform
            transform: styles.transform,
            transformOrigin: styles.transformOrigin,
            // Animation & Transition
            transition: styles.transition,
            animation: styles.animation,
            // Shadow
            boxShadow: styles.boxShadow,
            textShadow: styles.textShadow,
            // Border
            border: styles.border,
            borderRadius: styles.borderRadius,
            // Advanced
            filter: styles.filter,
            mixBlendMode: styles.mixBlendMode,
            clipPath: styles.clipPath,
            // Check a specific emoji rendering (might vary slightly)
            emojiTest: (() => {
                const emojiSpan = document.createElement('span');
                emojiSpan.style.fontSize = '30px'; // Ensure size for rendering
                emojiSpan.textContent = '❤️'; // A common emoji that can have rendering variations
                testElement.appendChild(emojiSpan);
                const emojiWidth = emojiSpan.offsetWidth;
                const emojiHeight = emojiSpan.offsetHeight;
                testElement.removeChild(emojiSpan);
                return `${emojiWidth}x${emojiHeight}`;
            })()
        };
        // console.log("Render Data:", renderData);
        return calculateHash(renderData);
    };

    // Get Speech Synthesis Voices
    const getSpeechVoices = () => {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window) || !window.speechSynthesis.getVoices) {
                return resolve('');
            }
            let voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                resolve(calculateHash(voices.map(v => `${v.name}|${v.lang}|${v.default}|${v.localService}`).sort().join(';')));
            } else {
                // Voices might load asynchronously
                window.speechSynthesis.onvoiceschanged = () => {
                    voices = window.speechSynthesis.getVoices();
                    resolve(calculateHash(voices.map(v => `${v.name}|${v.lang}|${v.default}|${v.localService}`).sort().join(';')));
                    window.speechSynthesis.onvoiceschanged = null; // Clean up
                };
                // Trigger loading if not already triggered (some browsers need this)
                setTimeout(() => { // Timeout if onvoiceschanged doesn't fire
                    voices = window.speechSynthesis.getVoices();
                     resolve(calculateHash(voices.map(v => `${v.name}|${v.lang}|${v.default}|${v.localService}`).sort().join(';')));
                }, 200);
            }
        });
    };

    // Add this new function to check storage
    const checkStorageQuota = async () => {
        const storageInfo = {
            localStorage: { used: 0, remaining: 'N/A' },
            sessionStorage: { used: 0, remaining: 'N/A' },
            quota: { used: 0, granted: 0, remaining: 0 }
        };

        // Check localStorage usage
        try {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                total += (key.length + value.length) * 2; // Each character is 2 bytes
            }
            storageInfo.localStorage.used = total;
        } catch (e) {
            console.error('Error checking localStorage:', e);
        }

        // Check sessionStorage usage
        try {
            let total = 0;
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                const value = sessionStorage.getItem(key);
                total += (key.length + value.length) * 2;
            }
            storageInfo.sessionStorage.used = total;
        } catch (e) {
            console.error('Error checking sessionStorage:', e);
        }

        // Check overall storage quota if available
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                storageInfo.quota = {
                    used: estimate.usage || 0,
                    granted: estimate.quota || 0,
                    remaining: estimate.quota ? estimate.quota - estimate.usage : 0
                };
            } catch (e) {
                console.error('Error checking storage quota:', e);
            }
        }

        setStorageInfo(storageInfo);
    };

    useEffect(() => {
        const fetchFingerprintData = async () => {
            try {
                // Initialize FingerprintJS
                const fpPromise = FingerprintJS.load({
                    // Optionally provide monitoring: false if you don't want to send data to FPJS servers
                    // monitoring: false 
                });

                const [fp, speechHash] = await Promise.all([
                    fpPromise.then(fp => fp.get({ extendedResult: true })), // extendedResult for more components
                    getSpeechVoices()
                ]);

                // Check storage quota
                await checkStorageQuota();

                setVisitorId(fp.visitorId);
                setComponentsData(fp.components);

                // Extract and hash specific components from FingerprintJS result
                // The keys here depend on what FingerprintJS provides in `fp.components`
                // Refer to FingerprintJS documentation for the exact component keys.
                // Example:
                const fontsComponent = fp.components.fonts; // This might be an object or array
                const canvasComponent = fp.components.canvas;
                const webglComponent = fp.components.webgl;
                const audioComponent = fp.components.audio; // From extendedResult

                setComponentFingerprints(prev => ({
                    ...prev,
                    fonts: fontsComponent ? calculateHash(fontsComponent.value) : 'N/A',
                    canvas: canvasComponent ? calculateHash(canvasComponent.value) : 'N/A',
                    webgl: webglComponent ? calculateHash(webglComponent.value) : 'N/A',
                    audio: audioComponent ? calculateHash(audioComponent.value) : 'N/A',
                    speech: speechHash || 'N/A',
                }));

                // Perform render test after a short delay to ensure DOM is ready
                // Using requestAnimationFrame for better timing with rendering
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { // Double RAF for more certainty
                        const renderHash = getRenderTestData();
                        setComponentFingerprints(prev => ({
                            ...prev,
                            render: renderHash
                        }));
                        setLoading(false);
                    });
                });

            } catch (error) {
                console.error("FingerprintJS Error:", error);
                setLoading(false);
            }
        };

        // Delay initial fetch slightly to allow other scripts/DOM to settle
        const timerId = setTimeout(fetchFingerprintData, 100);
        return () => clearTimeout(timerId);
    }, []);

    if (loading) {
        return <div>Loading enhanced fingerprint data...</div>;
    }

    return (
        <div className="fingerprint-test-container">
            <h1>Enhanced Fingerprint Test (using FingerprintJS)</h1>
            <div className="fingerprint-card">
                <h2>Your Overall Visitor ID (from FingerprintJS)</h2>
                <div className="fingerprint-display">{visitorId}</div>

                <div className="info-section">
                    <h3>Storage Information</h3>
                    <div className="fingerprints-grid">
                        <div className="fingerprint-item">
                            <span className="label">LocalStorage:</span>
                            <span className="value">Used: {(storageInfo.localStorage.used / 1024).toFixed(2)} KB</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">SessionStorage:</span>
                            <span className="value">Used: {(storageInfo.sessionStorage.used / 1024).toFixed(2)} KB</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">Storage Quota:</span>
                            <span className="value">
                                Used: {(storageInfo.quota.used / (1024 * 1024)).toFixed(2)} MB<br/>
                                Granted: {(storageInfo.quota.granted / (1024 * 1024)).toFixed(2)} MB<br/>
                                Remaining: {(storageInfo.quota.remaining / (1024 * 1024)).toFixed(2)} MB
                            </span>
                        </div>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Derived Component Fingerprints</h3>
                    <div className="fingerprints-grid">
                        {Object.entries(componentFingerprints).map(([key, value]) => (
                            <div className="fingerprint-item" key={key}>
                                <span className="label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                                <span className="value">{value || 'Calculating/Error'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Raw FingerprintJS Component Details</h3>
                    <div className="info-grid">
                        {componentsData && Object.entries(componentsData).map(([key, component]) => (
                            <div key={key} className="info-item">
                                <span className="label">{key}:</span>
                                <span className="value">
                                    {typeof component.value === 'object'
                                        ? JSON.stringify(component.value, null, 2)
                                        : String(component.value)}
                                </span>
                                {component.duration && <span className="duration">Duration: {component.duration}ms</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hidden render test element */}
            <div
                ref={renderTestRef}
                style={{
                    position: 'absolute',
                    left: '-9999px', // Move off-screen
                    top: '-9999px',
                    visibility: 'hidden', // Still useful for elements that might not render if display:none
                    width: '234px', // Use uncommon dimensions
                    height: '178px',
                    background: 'radial-gradient(circle, rgba(63,94,251,1) 0%, rgba(252,70,107,1) 100%)',
                    borderRadius: '13px 27px 31px 43px / 43px 31px 27px 13px', // Asymmetric border radius
                    boxShadow: '3px -2px 8px 1px rgba(0,128,128,0.65)',
                    transform: 'skewX(-15deg) rotate(7deg)',
                    fontFamily: 'Verdana, "Comic Sans MS", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif', // Mix common and less common, plus emoji fonts
                    fontSize: '17.3px',
                    fontWeight: '600',
                    color: 'rgb(200, 210, 220)',
                    textShadow: '1px 1px 0px #333, -1px -1px 0px #CCC',
                    letterSpacing: '0.3px',
                    lineHeight: '1.37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    border: '3px dashed #FFA07A',
                    margin: '13px',
                    padding: '7px',
                    boxSizing: 'content-box', // Different box model
                    opacity: '0.95',
                    filter: 'contrast(1.1) saturate(1.2)',
                    mixBlendMode: 'overlay',
                    clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' // Complex clip path
                }}
            >
                Render Test Content with  कुछ पाठ्य and symbols © ± ≠
            </div>

            {/* CSS (same as your original, but ensure class names match) */}
            <style jsx>{`
                .fingerprint-test-container { /* Renamed from fingerprint2-test-container */
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                    font-family: sans-serif;
                }
                .fingerprint-card { /* Styles from original */
                    background: linear-gradient(135deg, #6c5ce7, #a8a4e6);
                    color: white;
                    padding: 2rem;
                    border-radius: 15px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin: 2rem 0;
                }
                .fingerprint-display { /* Styles from original */
                    font-size: 1.2rem; /* Adjusted */
                    font-family: monospace;
                    word-break: break-all;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                    text-align: center;
                }
                .info-section { /* Styles from original */
                    margin-top: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                }
                .info-section h3 { /* Styles from original */
                    margin: 0 0 1rem 0;
                    font-size: 1.2rem;
                    color: rgba(255, 255, 255, 0.9);
                }
                .fingerprints-grid { /* Styles from original */
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Adjusted */
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .fingerprint-item { /* Styles from original */
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .fingerprint-item .label { /* Styles from original */
                    font-size: 1rem; /* Adjusted */
                    font-weight: bold;
                    color: #ffeaa7;
                }
                .fingerprint-item .value { /* Styles from original */
                    font-family: monospace;
                    font-size: 0.8rem; /* Adjusted */
                    word-break: break-all;
                }
                .info-grid { /* Styles from original */
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1rem;
                }
                .info-item { /* Styles from original */
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.8rem;
                    border-radius: 6px;
                }
                .info-item .label { /* Styles from original */
                    display: block;
                    font-size: 0.9rem;
                    font-weight: bold; /* Added */
                    color: #d1c4e9; /* Light purple */
                    margin-bottom: 0.3rem;
                }
                .info-item .value { /* Styles from original */
                    font-family: monospace;
                    font-size: 0.85rem; /* Adjusted */
                    word-break: break-all;
                    white-space: pre-wrap;
                }
                .info-item .duration {
                    display: block;
                    font-size: 0.75rem;
                    opacity: 0.7;
                    margin-top: 0.3rem;
                }
                h1 { /* Styles from original */
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 2rem;
                }
                h2 { /* Styles from original */
                    margin: 0 0 0.5rem 0; /* Added bottom margin */
                    font-size: 1.5rem;
                    text-align: center;
                }
                @media (max-width: 768px) { /* Styles from original */
                    .fingerprint-test-container {
                        padding: 1rem;
                    }
                    .info-grid,
                    .fingerprints-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default EnhancedFingerprintTest; 