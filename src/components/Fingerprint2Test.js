import React, { useEffect, useState, useRef } from 'react';
import Fingerprint2 from 'fingerprintjs2';

const Fingerprint2Test = () => {
    const [componentsData, setComponentsData] = useState(null);
    const [fingerprintHash, setFingerprintHash] = useState('');
    const [componentFingerprints, setComponentFingerprints] = useState({
        hardware: '',
        browser: '',
        screen: '',
        plugins: '',
        fonts: '',
        canvas: '',
        webgl: '',
        render: ''
    });
    const [loading, setLoading] = useState(true);
    const renderTestRef = useRef(null);

    // Helper function to calculate hash for specific components
    const calculateComponentHash = (components, keys) => {
        const relevantComponents = components.filter(comp => keys.includes(comp.key));
        const values = relevantComponents.map(comp => comp.value);
        return Fingerprint2.x64hash128(values.join(''), 31);
    };

    // Helper function to get render test data
    const getRenderTestData = () => {
        const testElement = renderTestRef.current;
        if (!testElement) return '';

        const styles = window.getComputedStyle(testElement);
        const renderData = {
            // Text rendering
            textRendering: styles.textRendering,
            fontSmoothing: styles.webkitFontSmoothing,
            // Color rendering
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            // Layout rendering
            boxSizing: styles.boxSizing,
            display: styles.display,
            position: styles.position,
            // Transform rendering
            transform: styles.transform,
            transformOrigin: styles.transformOrigin,
            // Animation rendering
            transition: styles.transition,
            animation: styles.animation,
            // Shadow rendering
            boxShadow: styles.boxShadow,
            textShadow: styles.textShadow,
            // Border rendering
            border: styles.border,
            borderRadius: styles.borderRadius,
            // Font rendering
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            // Layout measurements
            width: testElement.offsetWidth,
            height: testElement.offsetHeight,
            clientWidth: testElement.clientWidth,
            clientHeight: testElement.clientHeight,
            // Scroll measurements
            scrollWidth: testElement.scrollWidth,
            scrollHeight: testElement.scrollHeight,
            // Position measurements
            offsetLeft: testElement.offsetLeft,
            offsetTop: testElement.offsetTop
        };
        console.log(renderData);
        return Fingerprint2.x64hash128(JSON.stringify(renderData), 31);
    };

    useEffect(() => {
        const fetchFingerprintData = async () => {
            try {
                const options = {};
                const components = await Fingerprint2.getPromise(options);
                setComponentsData(components);

                // Calculate main fingerprint
                const values = components.map(component => component.value);
                const murmur = Fingerprint2.x64hash128(values.join(''), 31);
                setFingerprintHash(murmur);

                // Calculate component-specific fingerprints
                setComponentFingerprints(prev => ({
                    ...prev,
                    hardware: calculateComponentHash(components, [
                        'hardware_concurrency',
                        'device_memory',
                        'cpu_class',
                        'platform'
                    ]),
                    browser: calculateComponentHash(components, [
                        'user_agent',
                        'language',
                        'color_depth',
                        'pixel_ratio',
                        'timezone_offset'
                    ]),
                    screen: calculateComponentHash(components, [
                        'screen_resolution',
                        'available_screen_resolution',
                        'screen_width',
                        'screen_height'
                    ]),
                    plugins: calculateComponentHash(components, [
                        'plugins',
                        'mime_types'
                    ]),
                    fonts: calculateComponentHash(components, [
                        'fonts',
                        'fonts_flash'
                    ]),
                    canvas: calculateComponentHash(components, [
                        'canvas',
                        'canvas_fonts'
                    ]),
                    webgl: calculateComponentHash(components, [
                        'webgl',
                        'webgl_vendor',
                        'webgl_renderer'
                    ])
                }));

                // Wait for render test element to be ready
                setTimeout(() => {
                    const renderHash = getRenderTestData();
                    setComponentFingerprints(prev => ({
                        ...prev,
                        render: renderHash
                    }));
                }, 100);

            } catch (error) {
                console.error("Fingerprint2 Error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timerId = setTimeout(fetchFingerprintData, 50);
        return () => clearTimeout(timerId);
    }, []);

    if (loading) {
        return <div>Loading fingerprint data...</div>;
    }

    return (
        <div className="fingerprint2-test-container">
            <h1>Fingerprint2 Test</h1>
            <div className="fingerprint-card">
                <h2>Your Fingerprint</h2>
                <div className="fingerprint-display">{fingerprintHash}</div>

                <div className="info-section">
                    <h3>Component Fingerprints</h3>
                    <div className="fingerprints-grid">
                        <div className="fingerprint-item">
                            <span className="label">Hardware:</span>
                            <span className="value">{componentFingerprints.hardware}</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">Browser:</span>
                            <span className="value">{componentFingerprints.browser}</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">Screen:</span>
                            <span className="value">{componentFingerprints.screen}</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">Plugins:</span>
                            <span className="value">{componentFingerprints.plugins}</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">Fonts:</span>
                            <span className="value">{componentFingerprints.fonts}</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">Canvas:</span>
                            <span className="value">{componentFingerprints.canvas}</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">WebGL:</span>
                            <span className="value">{componentFingerprints.webgl}</span>
                        </div>
                        <div className="fingerprint-item">
                            <span className="label">Render:</span>
                            <span className="value">{componentFingerprints.render || 'Calculating...'}</span>
                        </div>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Component Details</h3>
                    <div className="info-grid">
                        {componentsData && componentsData.map((component, index) => (
                            <div key={index} className="info-item">
                                <span className="label">{component.key}:</span>
                                <span className="value">
                                    {typeof component.value === 'object' 
                                        ? JSON.stringify(component.value, null, 2)
                                        : component.value}
                                </span>
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
                    visibility: 'hidden',
                    width: '100px',
                    height: '100px',
                    background: 'linear-gradient(45deg, #ff0000, #00ff00)',
                    borderRadius: '10px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    transform: 'rotate(45deg)',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #000000',
                    margin: '20px',
                    padding: '10px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                }}
            >
                Render Test
            </div>

            <style jsx>{`
                .fingerprint2-test-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .fingerprint-card {
                    background: linear-gradient(135deg, #6c5ce7, #a8a4e6);
                    color: white;
                    padding: 2rem;
                    border-radius: 15px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin: 2rem 0;
                }

                .fingerprint-display {
                    font-size: 1.5rem;
                    font-family: monospace;
                    word-break: break-all;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                    text-align: center;
                }

                .info-section {
                    margin-top: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                }

                .info-section h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1.2rem;
                    color: rgba(255, 255, 255, 0.9);
                }

                .fingerprints-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .fingerprint-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .fingerprint-item .label {
                    font-size: 1.1rem;
                    font-weight: bold;
                    color: #ffeaa7;
                }

                .fingerprint-item .value {
                    font-family: monospace;
                    font-size: 0.9rem;
                    word-break: break-all;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1rem;
                }

                .info-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.8rem;
                    border-radius: 6px;
                }

                .info-item .label {
                    display: block;
                    font-size: 0.9rem;
                    opacity: 0.9;
                    margin-bottom: 0.3rem;
                }

                .info-item .value {
                    font-family: monospace;
                    font-size: 1.1rem;
                    word-break: break-all;
                    white-space: pre-wrap;
                }

                h1 {
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 2rem;
                }

                h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    text-align: center;
                }

                @media (max-width: 768px) {
                    .fingerprint2-test-container {
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

export default Fingerprint2Test; 