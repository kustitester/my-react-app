import React, { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open("RandomNumberDB", 1); // Create or open the database
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("randomNumbers")) {
                db.createObjectStore("randomNumbers", { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error opening IndexedDB');
    });
};

// Function to get the random number from IndexedDB
const getRandomNumberFromDB = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("randomNumbers", "readonly");
        const store = transaction.objectStore("randomNumbers");
        const request = store.get(1); // Get the random number with key 1
        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null); // Return the random number if it exists
        };
        request.onerror = () => reject('Error retrieving from IndexedDB');
    });
};

// Function to store the random number in IndexedDB
const storeRandomNumberInDB = async (randomNumber) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("randomNumbers", "readwrite");
        const store = transaction.objectStore("randomNumbers");
        const request = store.put({ id: 1, value: randomNumber }); // Store with key 1
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error storing in IndexedDB');
    });
};


const Home = () => {
    const [userInfo, setUserInfo] = useState({});

    const [randomNumber, setRandomNumber] = useState(null);

    // Function to generate a random number
    const generateRandomNumber = () => {
        return Math.floor(Math.random() * 1000000); // Random number between 0 and 999999
    };

    useEffect(() => {
        // Try to retrieve the random number from IndexedDB
        const fetchRandomNumber = async () => {
            const storedRandomNumber = await getRandomNumberFromDB();
            if (storedRandomNumber !== null) {
                setRandomNumber(storedRandomNumber);
            } else {
                // If no number exists, generate a new random number and store it
                const newRandomNumber = generateRandomNumber();
                await storeRandomNumberInDB(newRandomNumber);
                setRandomNumber(newRandomNumber);
            }
        };

        fetchRandomNumber();
    }, []); // Empty dependency array ensures this runs once when the component mounts

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

            // Helper function to get geolocation
            const getGeolocation = async () => {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    return {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy, // Accuracy of the location
                    };
                } catch (error) {
                    return 'Error retrieving geolocation';
                }
            };

            // Helper function to get IP address (via external API)
            const getIpAddress = async () => {
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    return data.ip;
                } catch (error) {
                    return 'Error retrieving IP address';
                }
            };

            // Helper function to get network information
            const getNetworkInfo = () => {
                try {
                    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                    return connection
                        ? {
                            effectiveType: connection.effectiveType, // 'slow-2g', '2g', '3g', '4g'
                            downlink: connection.downlink, // Maximum downlink speed (Mbps)
                            rtt: connection.rtt, // Round-trip time (ms)
                            saveData: connection.saveData, // Whether the user has "Save Data" mode on
                        }
                        : 'Network Information Not Supported';
                } catch {
                    return 'Error retrieving network information';
                }
            };

            // Helper function to get device orientation
            const getDeviceOrientation = () => {
                try {
                    const orientation = {
                        alpha: window.orientation || null, // Rotation around the z-axis (compass heading)
                        beta: null, // Rotation around the x-axis (forward/backward tilt)
                        gamma: null, // Rotation around the y-axis (left/right tilt)
                    };
                    window.addEventListener('deviceorientation', (e) => {
                        orientation.alpha = e.alpha;
                        orientation.beta = e.beta;
                        orientation.gamma = e.gamma;
                    });
                    return orientation;
                } catch {
                    return 'Error retrieving device orientation';
                }
            };

            // Helper function to check storage support
            const getStorageSupport = () => {
                return {
                    localStorage: typeof localStorage !== 'undefined' ? 'Available' : 'Not Available',
                    sessionStorage: typeof sessionStorage !== 'undefined' ? 'Available' : 'Not Available',
                };
            };

            // Helper function to get screen information
            const getScreenInfo = () => ({
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                screenColorDepth: window.screen.colorDepth,
                screenPixelDepth: window.screen.pixelDepth, // Screen pixel depth (bits per pixel)
                screenAvailableWidth: window.screen.availWidth, // Available screen width (excluding taskbars)
                screenAvailableHeight: window.screen.availHeight, // Available screen height
            });

            const getCanvasFingerprint = () => {
                // Create a canvas element
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
            
                // Set canvas dimensions
                canvas.width = 200;
                canvas.height = 200;
            
                // Draw some random text on the canvas (this varies depending on fonts)
                ctx.textBaseline = 'top';
                ctx.font = '16px Arial'; // Try different fonts and sizes to make it more unique
                ctx.fillText('Canvas Fingerprint Test', 2, 2);
            
                // Draw some additional graphics (this can add more uniqueness)
                ctx.fillRect(50, 50, 100, 100);
            
                // Get the image data (pixel data)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
                // Convert the image data to a hash string
                const data = imageData.data;
                let hash = 0;
            
                for (let i = 0; i < data.length; i++) {
                    hash += data[i]; // Simple accumulation (or you can use more advanced hashing)
                }
            
                // Return the hash as a unique fingerprint
                return hash.toString();
            };

            const userInfo = {
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
                webglInfo: getWebGLParameters(), // WebGL Renderer and Parameters
                keyboardLayout: getKeyboardLayout(), // Keyboard layout information
                mediaDevices: await getMediaDevices(), // Media devices
                batteryStatus: await getBatteryStatus(), // Battery status
                fonts: getFonts(), // List of fonts
                geolocation: await getGeolocation(), // Geolocation
                ipAddress: await getIpAddress(), // IP Address
                networkInfo: getNetworkInfo(), // Network information
                deviceOrientation: getDeviceOrientation(), // Device orientation
                storageSupport: getStorageSupport(), // LocalStorage / SessionStorage support
                screenInfo: getScreenInfo(), // Screen information
                canvasFingerprint: getCanvasFingerprint(),
            };

            setUserInfo(userInfo);
        };

        // Call the function to log user info
        getUserFingerprint();
    }, []); // Empty dependency array ensures it runs once when the component mounts

    useEffect(() => {
        const getFingerprint = async () => {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            console.log("Visitor Fingerprint:", result.visitorId);
        };

        getFingerprint();
    }, []);

    return (
        <div>
            <h2>Home Page</h2>
            <div>
                <h3>User Information:</h3>
                <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                <h3>Random Number:</h3>
                <p>{randomNumber}</p> {/* Display the random number */}
            </div>
        </div>
    );
};

export default Home;
