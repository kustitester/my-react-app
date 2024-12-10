import React, { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const Home = () => {
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const getUserFingerprint = async () => {
            // Helper function to get media devices
            const getMediaDevices = async () => {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    return devices.map(device => ({
                        kind: device.kind,
                        label: device.label,
                        deviceId: device.deviceId,
                    }));
                } catch {
                    return 'Error retrieving media devices';
                }
            };

            // Helper function to get battery status
            const getBatteryStatus = async () => {
                try {
                    const battery = navigator.getBattery ? await navigator.getBattery() : null;
                    return battery
                        ? {
                              charging: battery.charging,
                              level: battery.level * 100 + '%',
                              chargingTime: battery.chargingTime,
                              dischargingTime: battery.dischargingTime,
                          }
                        : 'Not Supported';
                } catch {
                    return 'Error retrieving battery status';
                }
            };

            // Helper function to get the list of fonts
            const getFonts = () => {
                try {
                    const testString = 'mmmmmmmmmmlli';
                    const testSize = '72px';
                    const baseFonts = ['monospace', 'sans-serif', 'serif'];
                    const fontList = [
                        'Arial',
                        'Courier New',
                        'Georgia',
                        'Times New Roman',
                        'Verdana',
                        // Add more common fonts as needed
                    ];

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 400;
                    canvas.height = 200;

                    const detectFont = (font) => {
                        context.font = `${testSize} ${font}, ${baseFonts[0]}`;
                        const baseWidth = context.measureText(testString).width;
                        for (const baseFont of baseFonts) {
                            context.font = `${testSize} ${baseFont}`;
                            if (context.measureText(testString).width !== baseWidth) {
                                return true; // Font detected
                            }
                        }
                        return false; // Font not detected
                    };

                    return fontList.filter(detectFont);
                } catch {
                    return 'Error detecting fonts';
                }
            };

            // Helper function to gather WebGL parameters
            const getWebGLParameters = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (!gl) return 'Not Supported';

                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    return {
                        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
                        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
                        parameters: {
                            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                            maxCubeMapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
                            maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                        },
                    };
                } catch (error) {
                    return 'Error retrieving WebGL info';
                }
            };

            // Helper function to get keyboard layout
            const getKeyboardLayout = () => {
                try {
                    return navigator.keyboard ? 'Detected' : 'Not Available';
                } catch {
                    return 'Error retrieving keyboard layout';
                }
            };

            const userInformation = {
                userAgent: navigator.userAgent, // Browser user agent
                platform: navigator.platform, // OS platform
                language: navigator.language, // Browser language
                cookiesEnabled: navigator.cookieEnabled, // Cookies enabled
                screenResolution: `${window.screen.width}x${window.screen.height}`, // Screen resolution
                colorDepth: window.screen.colorDepth, // Color depth
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Timezone
                onlineStatus: navigator.onLine, // Online status
                deviceMemory: navigator.deviceMemory || 'Unknown', // Device memory (if available)
                hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown', // Number of logical processors
                canvasSupported: !!document.createElement('canvas').getContext, // Check if Canvas is supported
                webglInfo: await getWebGLParameters(), // WebGL Renderer and Parameters
                keyboardLayout: await getKeyboardLayout(), // Keyboard layout information
                mediaDevices: await getMediaDevices(), // Media devices
                batteryStatus: await getBatteryStatus(), // Battery status
                fonts: await getFonts(), // List of fonts
            };

            setUserInfo(userInformation); // Update state with user info
        };

        // Call the function to log user info
        getUserFingerprint();
    }, []); // Empty dependency array ensures it runs once when the component mounts

    useEffect(() => {
        const getFingerprint = async () => {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            setUserInfo((prevState) => ({
                ...prevState,
                visitorFingerprint: result.visitorId,
            }));
        };

        getFingerprint();
    }, []);

    if (!userInfo) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Home Page</h2>
            <h3>User Information</h3>
            <pre>{JSON.stringify(userInfo, null, 2)}</pre>
        </div>
    );
};

export default Home;
