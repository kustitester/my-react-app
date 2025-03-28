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

            // Helper function to get detailed hardware information
            const getDetailedHardwareInfo = async () => {
                try {
                    // Get detailed screen information
                    const screenDetails = {
                        width: window.screen.width,
                        height: window.screen.height,
                        availWidth: window.screen.availWidth,
                        availHeight: window.screen.availHeight,
                        colorDepth: window.screen.colorDepth,
                        pixelDepth: window.screen.pixelDepth,
                        devicePixelRatio: window.devicePixelRatio,
                        orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
                        // Get the actual physical dimensions if available
                        physicalWidth: window.screen.width * window.devicePixelRatio,
                        physicalHeight: window.screen.height * window.devicePixelRatio
                    };

                    // Get detailed WebGL information for GPU fingerprinting
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl');
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    const webglDetails = {
                        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
                        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
                        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                        version: gl.getParameter(gl.VERSION),
                        parameters: {
                            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                            maxCubeMapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
                            maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                            vendor: gl.getParameter(gl.VENDOR),
                            version: gl.getParameter(gl.VERSION)
                        }
                    };

                    // Get detailed audio context information
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const audioDetails = {
                        sampleRate: audioContext.sampleRate,
                        state: audioContext.state,
                        baseLatency: audioContext.baseLatency || 'Not Available',
                        outputLatency: audioContext.outputLatency || 'Not Available'
                    };

                    // Get detailed input device information
                    const inputDevices = await navigator.mediaDevices.enumerateDevices();
                    const inputDetails = inputDevices
                        .filter(device => device.kind === 'audioinput' || device.kind === 'videoinput')
                        .map(device => ({
                            kind: device.kind,
                            label: device.label,
                            deviceId: device.deviceId,
                            groupId: device.groupId // This can help identify devices from the same physical device
                        }));

                    // Get detailed keyboard information
                    const keyboardDetails = {
                        layout: navigator.keyboard ? 'Detected' : 'Not Available',
                        // Get keyboard layout information if available
                        language: navigator.language,
                        languages: navigator.languages,
                        // Get keyboard mapping
                        keyMapping: await getKeyboardMapping()
                    };

                    // Get detailed mouse information
                    const mouseDetails = {
                        hasTouch: 'ontouchstart' in window,
                        maxTouchPoints: navigator.maxTouchPoints || 0,
                        pointerEnabled: navigator.pointerEnabled || false,
                        // Get mouse DPI if available
                        dpi: await getMouseDPI()
                    };

                    return {
                        screen: screenDetails,
                        webgl: webglDetails,
                        audio: audioDetails,
                        inputDevices: inputDetails,
                        keyboard: keyboardDetails,
                        mouse: mouseDetails
                    };
                } catch (error) {
                    console.error('Error getting detailed hardware info:', error);
                    return 'Error retrieving detailed hardware information';
                }
            };

            // Helper function to get keyboard mapping
            const getKeyboardMapping = async () => {
                try {
                    const mapping = {};
                    // Test common key combinations
                    const keys = ['a', 'b', 'c', '1', '2', '3', '!', '@', '#'];
                    for (const key of keys) {
                        mapping[key] = key.charCodeAt(0);
                    }
                    return mapping;
                } catch {
                    return 'Not Available';
                }
            };

            // Helper function to get mouse DPI
            const getMouseDPI = async () => {
                try {
                    // Create a test element
                    const testElement = document.createElement('div');
                    testElement.style.width = '1in';
                    document.body.appendChild(testElement);
                    
                    // Get the actual width in pixels
                    const actualWidth = testElement.offsetWidth;
                    document.body.removeChild(testElement);
                    
                    // Calculate DPI (1 inch = 96 pixels in standard DPI)
                    return Math.round(actualWidth * 96);
                } catch {
                    return 'Not Available';
                }
            };

            // Helper function to get detailed keyboard information
            const getDetailedKeyboardInfo = async () => {
                try {
                    // Get keyboard layout information
                    const keyboardLayout = {
                        layout: navigator.keyboard ? 'Detected' : 'Not Available',
                        language: navigator.language,
                        languages: navigator.languages,
                        // Get keyboard mapping for more keys
                        keyMapping: await getEnhancedKeyboardMapping(),
                        // Get keyboard event information
                        keyEvents: await getKeyboardEventInfo(),
                        // Get keyboard timing information
                        keyTiming: await getKeyboardTimingInfo(),
                        // Get keyboard layout detection
                        layoutDetection: await getKeyboardLayoutDetection()
                    };
                    return keyboardLayout;
                } catch (error) {
                    console.error('Error getting detailed keyboard info:', error);
                    return 'Error retrieving keyboard information';
                }
            };

            // Helper function to get enhanced keyboard mapping
            const getEnhancedKeyboardMapping = async () => {
                try {
                    const mapping = {};
                    // Test a wider range of keys
                    const keys = [
                        // Letters
                        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
                        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                        // Numbers
                        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                        // Special characters
                        '!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
                        '-', '_', '+', '=', '[', ']', '{', '}', '|', '\\',
                        ';', ':', '"', "'", ',', '.', '/', '?', '`', '~',
                        // Function keys
                        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
                    ];

                    // Create a temporary input element
                    const input = document.createElement('input');
                    input.style.position = 'absolute';
                    input.style.opacity = '0';
                    document.body.appendChild(input);
                    input.focus();

                    // Test each key
                    for (const key of keys) {
                        try {
                            // Simulate key press
                            const event = new KeyboardEvent('keydown', {
                                key: key,
                                code: `Key${key.toUpperCase()}`,
                                keyCode: key.charCodeAt(0),
                                which: key.charCodeAt(0),
                                bubbles: true
                            });
                            input.dispatchEvent(event);
                            mapping[key] = {
                                charCode: key.charCodeAt(0),
                                keyCode: key.charCodeAt(0),
                                which: key.charCodeAt(0)
                            };
                        } catch (e) {
                            mapping[key] = 'Not Available';
                        }
                    }

                    document.body.removeChild(input);
                    return mapping;
                } catch (error) {
                    return 'Error getting keyboard mapping';
                }
            };

            // Helper function to get keyboard event information
            const getKeyboardEventInfo = async () => {
                try {
                    const events = {
                        keydown: false,
                        keyup: false,
                        keypress: false,
                        input: false,
                        compositionstart: false,
                        compositionend: false
                    };

                    // Create a temporary input element
                    const input = document.createElement('input');
                    input.style.position = 'absolute';
                    input.style.opacity = '0';
                    document.body.appendChild(input);
                    input.focus();

                    // Test each event type
                    for (const eventType in events) {
                        input.addEventListener(eventType, () => {
                            events[eventType] = true;
                        });
                    }

                    // Trigger events
                    const event = new KeyboardEvent('keydown', {
                        key: 'a',
                        code: 'KeyA',
                        keyCode: 65,
                        which: 65,
                        bubbles: true
                    });
                    input.dispatchEvent(event);

                    document.body.removeChild(input);
                    return events;
                } catch (error) {
                    return 'Error getting keyboard event info';
                }
            };

            // Helper function to get keyboard timing information
            const getKeyboardTimingInfo = async () => {
                try {
                    const timing = {
                        keyRepeatDelay: 0,
                        keyRepeatRate: 0
                    };

                    // Create a temporary input element
                    const input = document.createElement('input');
                    input.style.position = 'absolute';
                    input.style.opacity = '0';
                    document.body.appendChild(input);
                    input.focus();

                    // Measure key repeat timing
                    let lastKeyTime = 0;
                    let keyCount = 0;
                    let totalTime = 0;

                    input.addEventListener('keydown', (e) => {
                        const currentTime = Date.now();
                        if (lastKeyTime > 0) {
                            const timeDiff = currentTime - lastKeyTime;
                            totalTime += timeDiff;
                            keyCount++;
                        }
                        lastKeyTime = currentTime;
                    });

                    // Simulate key presses
                    for (let i = 0; i < 10; i++) {
                        const event = new KeyboardEvent('keydown', {
                            key: 'a',
                            code: 'KeyA',
                            keyCode: 65,
                            which: 65,
                            bubbles: true
                        });
                        input.dispatchEvent(event);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    document.body.removeChild(input);
                    timing.keyRepeatRate = keyCount > 0 ? totalTime / keyCount : 0;
                    return timing;
                } catch (error) {
                    return 'Error getting keyboard timing info';
                }
            };

            // Helper function to get keyboard layout detection
            const getKeyboardLayoutDetection = async () => {
                try {
                    const layouts = {
                        qwerty: false,
                        dvorak: false,
                        colemak: false
                    };

                    // Test for different keyboard layouts
                    const testString = 'the quick brown fox jumps over the lazy dog';
                    const input = document.createElement('input');
                    input.style.position = 'absolute';
                    input.style.opacity = '0';
                    document.body.appendChild(input);
                    input.focus();

                    // Simulate typing the test string
                    for (const char of testString) {
                        const event = new KeyboardEvent('keydown', {
                            key: char,
                            code: `Key${char.toUpperCase()}`,
                            keyCode: char.charCodeAt(0),
                            which: char.charCodeAt(0),
                            bubbles: true
                        });
                        input.dispatchEvent(event);
                    }

                    document.body.removeChild(input);
                    return layouts;
                } catch (error) {
                    return 'Error detecting keyboard layout';
                }
            };

            // Helper function to get detailed mouse information
            const getDetailedMouseInfo = async () => {
                try {
                    const mouseInfo = {
                        hasTouch: 'ontouchstart' in window,
                        maxTouchPoints: navigator.maxTouchPoints || 0,
                        pointerEnabled: navigator.pointerEnabled || false,
                        dpi: await getMouseDPI(),
                        // Get mouse movement patterns
                        movementPatterns: await getMouseMovementPatterns(),
                        // Get mouse button information
                        buttons: await getMouseButtonInfo(),
                        // Get mouse sensitivity information
                        sensitivity: await getMouseSensitivityInfo(),
                        // Get touchpad information
                        touchpad: await getTouchpadInfo()
                    };
                    return mouseInfo;
                } catch (error) {
                    console.error('Error getting detailed mouse info:', error);
                    return 'Error retrieving mouse information';
                }
            };

            // Helper function to get mouse movement patterns
            const getMouseMovementPatterns = async () => {
                try {
                    const patterns = {
                        smoothness: 0,
                        acceleration: false,
                        precision: 0
                    };

                    // Create a test element
                    const testElement = document.createElement('div');
                    testElement.style.width = '200px';
                    testElement.style.height = '200px';
                    testElement.style.border = '1px solid black';
                    document.body.appendChild(testElement);

                    // Track mouse movements
                    let lastX = 0;
                    let lastY = 0;
                    let totalDistance = 0;
                    let movementCount = 0;

                    testElement.addEventListener('mousemove', (e) => {
                        const currentX = e.clientX;
                        const currentY = e.clientY;
                        const distance = Math.sqrt(
                            Math.pow(currentX - lastX, 2) + 
                            Math.pow(currentY - lastY, 2)
                        );
                        totalDistance += distance;
                        movementCount++;
                        lastX = currentX;
                        lastY = currentY;
                    });

                    // Simulate mouse movement
                    const event = new MouseEvent('mousemove', {
                        clientX: 100,
                        clientY: 100,
                        bubbles: true
                    });
                    testElement.dispatchEvent(event);

                    document.body.removeChild(testElement);
                    patterns.smoothness = movementCount > 0 ? totalDistance / movementCount : 0;
                    return patterns;
                } catch (error) {
                    return 'Error getting mouse movement patterns';
                }
            };

            // Helper function to get mouse button information
            const getMouseButtonInfo = async () => {
                try {
                    const buttons = {
                        left: false,
                        right: false,
                        middle: false,
                        back: false,
                        forward: false
                    };

                    // Create a test element
                    const testElement = document.createElement('div');
                    testElement.style.width = '200px';
                    testElement.style.height = '200px';
                    testElement.style.border = '1px solid black';
                    document.body.appendChild(testElement);

                    // Test each button
                    for (const button in buttons) {
                        const event = new MouseEvent('mousedown', {
                            button: getButtonNumber(button),
                            bubbles: true
                        });
                        testElement.dispatchEvent(event);
                        buttons[button] = true;
                    }

                    document.body.removeChild(testElement);
                    return buttons;
                } catch (error) {
                    return 'Error getting mouse button info';
                }
            };

            // Helper function to get button number
            const getButtonNumber = (button) => {
                switch (button) {
                    case 'left': return 0;
                    case 'middle': return 1;
                    case 'right': return 2;
                    case 'back': return 3;
                    case 'forward': return 4;
                    default: return 0;
                }
            };

            // Helper function to get mouse sensitivity information
            const getMouseSensitivityInfo = async () => {
                try {
                    const sensitivity = {
                        dpi: await getMouseDPI(),
                        pollingRate: await getMousePollingRate(),
                        acceleration: await getMouseAcceleration()
                    };
                    return sensitivity;
                } catch (error) {
                    return 'Error getting mouse sensitivity info';
                }
            };

            // Helper function to get mouse polling rate
            const getMousePollingRate = async () => {
                try {
                    let lastTime = Date.now();
                    let eventCount = 0;
                    let totalTime = 0;

                    const testElement = document.createElement('div');
                    testElement.style.width = '200px';
                    testElement.style.height = '200px';
                    testElement.style.border = '1px solid black';
                    document.body.appendChild(testElement);

                    testElement.addEventListener('mousemove', () => {
                        const currentTime = Date.now();
                        const timeDiff = currentTime - lastTime;
                        totalTime += timeDiff;
                        eventCount++;
                        lastTime = currentTime;
                    });

                    // Simulate mouse movement
                    const event = new MouseEvent('mousemove', {
                        clientX: 100,
                        clientY: 100,
                        bubbles: true
                    });
                    testElement.dispatchEvent(event);

                    document.body.removeChild(testElement);
                    return eventCount > 0 ? 1000 / (totalTime / eventCount) : 0;
                } catch (error) {
                    return 'Error getting mouse polling rate';
                }
            };

            // Helper function to get mouse acceleration
            const getMouseAcceleration = async () => {
                try {
                    const testElement = document.createElement('div');
                    testElement.style.width = '200px';
                    testElement.style.height = '200px';
                    testElement.style.border = '1px solid black';
                    document.body.appendChild(testElement);

                    let lastSpeed = 0;
                    let accelerationDetected = false;

                    testElement.addEventListener('mousemove', (e) => {
                        const currentSpeed = Math.sqrt(
                            Math.pow(e.movementX, 2) + 
                            Math.pow(e.movementY, 2)
                        );
                        if (lastSpeed > 0 && currentSpeed > lastSpeed * 1.5) {
                            accelerationDetected = true;
                        }
                        lastSpeed = currentSpeed;
                    });

                    // Simulate mouse movement
                    const event = new MouseEvent('mousemove', {
                        clientX: 100,
                        clientY: 100,
                        movementX: 10,
                        movementY: 10,
                        bubbles: true
                    });
                    testElement.dispatchEvent(event);

                    document.body.removeChild(testElement);
                    return accelerationDetected;
                } catch (error) {
                    return 'Error detecting mouse acceleration';
                }
            };

            // Helper function to get touchpad information
            const getTouchpadInfo = async () => {
                try {
                    const touchpad = {
                        hasTouchpad: 'ontouchstart' in window,
                        maxTouchPoints: navigator.maxTouchPoints || 0,
                        touchEvents: {
                            touchstart: 'ontouchstart' in window,
                            touchmove: 'ontouchmove' in window,
                            touchend: 'ontouchend' in window,
                            touchcancel: 'ontouchcancel' in window
                        }
                    };
                    return touchpad;
                } catch (error) {
                    return 'Error getting touchpad info';
                }
            };

            // Helper function to get keyboard macro detection
            const getKeyboardMacroDetection = async () => {
                try {
                    const macroInfo = {
                        hasMacros: false,
                        suspiciousPatterns: [],
                        keyCombinations: [],
                        timingAnalysis: {
                            consistentIntervals: false,
                            averageInterval: 0,
                            standardDeviation: 0
                        }
                    };

                    // Create a temporary input element
                    const input = document.createElement('input');
                    input.style.position = 'absolute';
                    input.style.opacity = '0';
                    document.body.appendChild(input);
                    input.focus();

                    // Track key events
                    const keyEvents = [];
                    let lastKeyTime = Date.now();

                    // Listen for key events
                    const keyListener = (e) => {
                        const currentTime = Date.now();
                        const timeDiff = currentTime - lastKeyTime;
                        keyEvents.push({
                            key: e.key,
                            code: e.code,
                            timeDiff: timeDiff,
                            timestamp: currentTime
                        });
                        lastKeyTime = currentTime;
                    };

                    input.addEventListener('keydown', keyListener);

                    // Simulate some typing to collect data
                    const testString = 'the quick brown fox jumps over the lazy dog';
                    for (const char of testString) {
                        const event = new KeyboardEvent('keydown', {
                            key: char,
                            code: `Key${char.toUpperCase()}`,
                            keyCode: char.charCodeAt(0),
                            which: char.charCodeAt(0),
                            bubbles: true
                        });
                        input.dispatchEvent(event);
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // Random delay
                    }

                    // Remove event listener
                    input.removeEventListener('keydown', keyListener);
                    document.body.removeChild(input);

                    // Analyze timing patterns
                    if (keyEvents.length > 0) {
                        const timeDiffs = keyEvents.map(event => event.timeDiff);
                        const averageInterval = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
                        const standardDeviation = Math.sqrt(
                            timeDiffs.reduce((sq, n) => sq + Math.pow(n - averageInterval, 2), 0) / timeDiffs.length
                        );

                        // Check for suspicious patterns
                        const suspiciousPatterns = [];
                        
                        // Check for too consistent intervals (potential macro)
                        if (standardDeviation < 5) {
                            suspiciousPatterns.push('Very consistent key timing detected');
                            macroInfo.hasMacros = true;
                        }

                        // Check for rapid key combinations
                        const rapidCombos = keyEvents.filter((event, index) => {
                            if (index === 0) return false;
                            return event.timeDiff < 10;
                        });

                        if (rapidCombos.length > 0) {
                            suspiciousPatterns.push('Rapid key combinations detected');
                            macroInfo.hasMacros = true;
                        }

                        // Check for unnatural key patterns
                        const unnaturalPatterns = keyEvents.filter((event, index) => {
                            if (index < 2) return false;
                            const prevEvent = keyEvents[index - 1];
                            const prevPrevEvent = keyEvents[index - 2];
                            return event.timeDiff === prevEvent.timeDiff && 
                                   prevEvent.timeDiff === prevPrevEvent.timeDiff;
                        });

                        if (unnaturalPatterns.length > 0) {
                            suspiciousPatterns.push('Unnatural key patterns detected');
                            macroInfo.hasMacros = true;
                        }

                        macroInfo.suspiciousPatterns = suspiciousPatterns;
                        macroInfo.timingAnalysis = {
                            consistentIntervals: standardDeviation < 5,
                            averageInterval: averageInterval,
                            standardDeviation: standardDeviation
                        };
                    }

                    return macroInfo;
                } catch (error) {
                    console.error('Error detecting keyboard macros:', error);
                    return 'Error detecting keyboard macros';
                }
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
                detailedHardware: await getDetailedHardwareInfo(),
                detailedKeyboard: await getDetailedKeyboardInfo(),
                detailedMouse: await getDetailedMouseInfo(),
                keyboardMacros: await getKeyboardMacroDetection(),
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
        <div className="home-container">
            <div className="header-section">
                <h1>Browser Fingerprint Information</h1>
                <div className="random-number-card">
                    <h2>Your Unique Number</h2>
                    <div className="number-display">{randomNumber}</div>
                </div>
            </div>

            <div className="info-grid">
                <div className="info-section">
                    <h3>Basic Information</h3>
                    <div className="info-card">
                        <p><strong>User Agent:</strong> {userInfo.userAgent}</p>
                        <p><strong>Platform:</strong> {userInfo.platform}</p>
                        <p><strong>Language:</strong> {userInfo.language}</p>
                        <p><strong>Timezone:</strong> {userInfo.timezone}</p>
                        <p><strong>Cookies Enabled:</strong> {userInfo.cookiesEnabled ? 'Yes' : 'No'}</p>
                        <p><strong>Online Status:</strong> {userInfo.onlineStatus ? 'Online' : 'Offline'}</p>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Screen & Display</h3>
                    <div className="info-card">
                        <p><strong>Resolution:</strong> {userInfo.screenResolution}</p>
                        <p><strong>Color Depth:</strong> {userInfo.colorDepth}</p>
                        {userInfo.screenInfo && (
                            <>
                                <p><strong>Available Width:</strong> {userInfo.screenInfo.screenAvailableWidth}</p>
                                <p><strong>Available Height:</strong> {userInfo.screenInfo.screenAvailableHeight}</p>
                                <p><strong>Pixel Depth:</strong> {userInfo.screenInfo.screenPixelDepth}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Hardware</h3>
                    <div className="info-card">
                        <p><strong>Device Memory:</strong> {userInfo.deviceMemory}</p>
                        <p><strong>CPU Cores:</strong> {userInfo.hardwareConcurrency}</p>
                        <p><strong>Battery Status:</strong> {typeof userInfo.batteryStatus === 'object' ? 
                            `${userInfo.batteryStatus.level} (${userInfo.batteryStatus.charging ? 'Charging' : 'Not Charging'})` : 
                            userInfo.batteryStatus}</p>
                        <p><strong>Canvas Supported:</strong> {userInfo.canvasSupported ? 'Yes' : 'No'}</p>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Network</h3>
                    <div className="info-card">
                        <p><strong>IP Address:</strong> {userInfo.ipAddress}</p>
                        {typeof userInfo.networkInfo === 'object' && (
                            <>
                                <p><strong>Connection Type:</strong> {userInfo.networkInfo.effectiveType}</p>
                                <p><strong>Downlink Speed:</strong> {userInfo.networkInfo.downlink} Mbps</p>
                                <p><strong>RTT:</strong> {userInfo.networkInfo.rtt} ms</p>
                                <p><strong>Save Data Mode:</strong> {userInfo.networkInfo.saveData ? 'Enabled' : 'Disabled'}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h3>WebGL Information</h3>
                    <div className="info-card">
                        {typeof userInfo.webglInfo === 'object' && (
                            <>
                                <p><strong>Renderer:</strong> {userInfo.webglInfo.renderer}</p>
                                <p><strong>Vendor:</strong> {userInfo.webglInfo.vendor}</p>
                                <p><strong>Max Texture Size:</strong> {userInfo.webglInfo.parameters.maxTextureSize}</p>
                                <p><strong>Max Cube Map Size:</strong> {userInfo.webglInfo.parameters.maxCubeMapSize}</p>
                                <p><strong>Max Render Buffer Size:</strong> {userInfo.webglInfo.parameters.maxRenderBufferSize}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Device & Storage</h3>
                    <div className="info-card">
                        <p><strong>Keyboard Layout:</strong> {userInfo.keyboardLayout}</p>
                        <p><strong>Device Orientation:</strong> {typeof userInfo.deviceOrientation === 'object' ? 
                            `Alpha: ${userInfo.deviceOrientation.alpha}, Beta: ${userInfo.deviceOrientation.beta}, Gamma: ${userInfo.deviceOrientation.gamma}` : 
                            userInfo.deviceOrientation}</p>
                        <p><strong>Local Storage:</strong> {userInfo.storageSupport?.localStorage}</p>
                        <p><strong>Session Storage:</strong> {userInfo.storageSupport?.sessionStorage}</p>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Media Devices</h3>
                    <div className="info-card">
                        {Array.isArray(userInfo.mediaDevices) && userInfo.mediaDevices.map((device, index) => (
                            <p key={index}>
                                <strong>{device.kind}:</strong> {device.label || 'No label'} (ID: {device.deviceId})
                            </p>
                        ))}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Location</h3>
                    <div className="info-card">
                        {typeof userInfo.geolocation === 'object' && (
                            <>
                                <p><strong>Latitude:</strong> {userInfo.geolocation.latitude}</p>
                                <p><strong>Longitude:</strong> {userInfo.geolocation.longitude}</p>
                                <p><strong>Accuracy:</strong> {userInfo.geolocation.accuracy} meters</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Fonts</h3>
                    <div className="info-card">
                        <p><strong>Available Fonts:</strong> {Array.isArray(userInfo.fonts) ? userInfo.fonts.join(', ') : userInfo.fonts}</p>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Canvas Fingerprint</h3>
                    <div className="info-card">
                        <p><strong>Hash:</strong> {userInfo.canvasFingerprint}</p>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Detailed Hardware Information</h3>
                    <div className="info-card">
                        {typeof userInfo.detailedHardware === 'object' && (
                            <>
                                <h4>Screen Details</h4>
                                <p><strong>Physical Resolution:</strong> {userInfo.detailedHardware.screen.physicalWidth}x{userInfo.detailedHardware.screen.physicalHeight}</p>
                                <p><strong>Device Pixel Ratio:</strong> {userInfo.detailedHardware.screen.devicePixelRatio}</p>
                                <p><strong>Orientation:</strong> {userInfo.detailedHardware.screen.orientation}</p>

                                <h4>GPU Information</h4>
                                <p><strong>WebGL Renderer:</strong> {userInfo.detailedHardware.webgl.renderer}</p>
                                <p><strong>WebGL Vendor:</strong> {userInfo.detailedHardware.webgl.vendor}</p>
                                <p><strong>Shading Language Version:</strong> {userInfo.detailedHardware.webgl.shadingLanguageVersion}</p>

                                <h4>Audio Information</h4>
                                <p><strong>Sample Rate:</strong> {userInfo.detailedHardware.audio.sampleRate} Hz</p>
                                <p><strong>Audio State:</strong> {userInfo.detailedHardware.audio.state}</p>
                                <p><strong>Base Latency:</strong> {userInfo.detailedHardware.audio.baseLatency}</p>

                                <h4>Input Devices</h4>
                                {userInfo.detailedHardware.inputDevices.map((device, index) => (
                                    <p key={index}>
                                        <strong>{device.kind}:</strong> {device.label || 'No label'} 
                                        <br/>
                                        <small>Device ID: {device.deviceId}</small>
                                        <br/>
                                        <small>Group ID: {device.groupId}</small>
                                    </p>
                                ))}

                                <h4>Keyboard Details</h4>
                                <p><strong>Layout:</strong> {userInfo.detailedHardware.keyboard.layout}</p>
                                <p><strong>Language:</strong> {userInfo.detailedHardware.keyboard.language}</p>
                                <p><strong>Languages:</strong> {userInfo.detailedHardware.keyboard.languages.join(', ')}</p>

                                <h4>Mouse Details</h4>
                                <p><strong>Touch Support:</strong> {userInfo.detailedHardware.mouse.hasTouch ? 'Yes' : 'No'}</p>
                                <p><strong>Max Touch Points:</strong> {userInfo.detailedHardware.mouse.maxTouchPoints}</p>
                                <p><strong>Pointer Enabled:</strong> {userInfo.detailedHardware.mouse.pointerEnabled ? 'Yes' : 'No'}</p>
                                <p><strong>Mouse DPI:</strong> {userInfo.detailedHardware.mouse.dpi}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Detailed Keyboard Information</h3>
                    <div className="info-card">
                        {typeof userInfo.detailedKeyboard === 'object' && (
                            <>
                                <h4>Basic Information</h4>
                                <p><strong>Layout:</strong> {userInfo.detailedKeyboard.layout}</p>
                                <p><strong>Language:</strong> {userInfo.detailedKeyboard.language}</p>
                                <p><strong>Languages:</strong> {userInfo.detailedKeyboard.languages.join(', ')}</p>

                                <h4>Key Mapping</h4>
                                <p><strong>Available Keys:</strong> {Object.keys(userInfo.detailedKeyboard.keyMapping).length}</p>
                                <div className="key-mapping-grid">
                                    {Object.entries(userInfo.detailedKeyboard.keyMapping).map(([key, value], index) => (
                                        <p key={index} className="key-mapping-item">
                                            <strong>{key}:</strong> {typeof value === 'object' ? 
                                                `charCode: ${value.charCode}, keyCode: ${value.keyCode}` : 
                                                value}
                                        </p>
                                    ))}
                                </div>

                                <h4>Event Support</h4>
                                {Object.entries(userInfo.detailedKeyboard.keyEvents).map(([event, supported], index) => (
                                    <p key={index}>
                                        <strong>{event}:</strong> {supported ? 'Supported' : 'Not Supported'}
                                    </p>
                                ))}

                                <h4>Timing Information</h4>
                                <p><strong>Key Repeat Rate:</strong> {userInfo.detailedKeyboard.keyTiming.keyRepeatRate.toFixed(2)} ms</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Detailed Mouse Information</h3>
                    <div className="info-card">
                        {typeof userInfo.detailedMouse === 'object' && (
                            <>
                                <h4>Basic Information</h4>
                                <p><strong>Touch Support:</strong> {userInfo.detailedMouse.hasTouch ? 'Yes' : 'No'}</p>
                                <p><strong>Max Touch Points:</strong> {userInfo.detailedMouse.maxTouchPoints}</p>
                                <p><strong>Pointer Enabled:</strong> {userInfo.detailedMouse.pointerEnabled ? 'Yes' : 'No'}</p>
                                <p><strong>Mouse DPI:</strong> {userInfo.detailedMouse.dpi}</p>

                                <h4>Movement Patterns</h4>
                                <p><strong>Smoothness:</strong> {userInfo.detailedMouse.movementPatterns.smoothness.toFixed(2)}</p>
                                <p><strong>Acceleration:</strong> {userInfo.detailedMouse.movementPatterns.acceleration ? 'Yes' : 'No'}</p>
                                <p><strong>Precision:</strong> {userInfo.detailedMouse.movementPatterns.precision}</p>

                                <h4>Button Support</h4>
                                {Object.entries(userInfo.detailedMouse.buttons).map(([button, supported], index) => (
                                    <p key={index}>
                                        <strong>{button}:</strong> {supported ? 'Supported' : 'Not Supported'}
                                    </p>
                                ))}

                                <h4>Sensitivity</h4>
                                <p><strong>Polling Rate:</strong> {userInfo.detailedMouse.sensitivity.pollingRate.toFixed(2)} Hz</p>
                                <p><strong>Acceleration:</strong> {userInfo.detailedMouse.sensitivity.acceleration ? 'Yes' : 'No'}</p>

                                <h4>Touchpad Information</h4>
                                <p><strong>Has Touchpad:</strong> {userInfo.detailedMouse.touchpad.hasTouchpad ? 'Yes' : 'No'}</p>
                                <p><strong>Max Touch Points:</strong> {userInfo.detailedMouse.touchpad.maxTouchPoints}</p>
                                {Object.entries(userInfo.detailedMouse.touchpad.touchEvents).map(([event, supported], index) => (
                                    <p key={index}>
                                        <strong>{event}:</strong> {supported ? 'Supported' : 'Not Supported'}
                                    </p>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Keyboard Macro Detection</h3>
                    <div className="info-card">
                        {typeof userInfo.keyboardMacros === 'object' && (
                            <>
                                <h4>Macro Status</h4>
                                <p><strong>Macros Detected:</strong> {userInfo.keyboardMacros.hasMacros ? 'Yes' : 'No'}</p>
                                
                                {userInfo.keyboardMacros.suspiciousPatterns.length > 0 && (
                                    <>
                                        <h4>Suspicious Patterns</h4>
                                        <ul>
                                            {userInfo.keyboardMacros.suspiciousPatterns.map((pattern, index) => (
                                                <li key={index}>{pattern}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                <h4>Timing Analysis</h4>
                                <p><strong>Consistent Intervals:</strong> {userInfo.keyboardMacros.timingAnalysis.consistentIntervals ? 'Yes' : 'No'}</p>
                                <p><strong>Average Interval:</strong> {userInfo.keyboardMacros.timingAnalysis.averageInterval.toFixed(2)} ms</p>
                                <p><strong>Standard Deviation:</strong> {userInfo.keyboardMacros.timingAnalysis.standardDeviation.toFixed(2)} ms</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .home-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .header-section {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .header-section h1 {
                    color: #2c3e50;
                    margin-bottom: 2rem;
                }

                .random-number-card {
                    background: linear-gradient(135deg, #6c5ce7, #a8a4e6);
                    color: white;
                    padding: 2rem;
                    border-radius: 15px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin: 0 auto;
                    max-width: 400px;
                }

                .random-number-card h2 {
                    margin: 0 0 1rem 0;
                    font-size: 1.5rem;
                }

                .number-display {
                    font-size: 3rem;
                    font-weight: bold;
                    font-family: monospace;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .info-section {
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    padding: 1.5rem;
                }

                .info-section h3 {
                    color: #2c3e50;
                    margin-top: 0;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #f0f0f0;
                }

                .info-card {
                    font-size: 0.9rem;
                }

                .info-card p {
                    margin: 0.5rem 0;
                    line-height: 1.5;
                }

                .info-card strong {
                    color: #6c5ce7;
                }

                .info-card h4 {
                    color: #2c3e50;
                    margin-top: 1.5rem;
                    margin-bottom: 0.5rem;
                    font-size: 1.1rem;
                }

                .info-card small {
                    color: #666;
                    display: block;
                    margin-top: 0.2rem;
                }

                @media (max-width: 768px) {
                    .home-container {
                        padding: 1rem;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                    }

                    .random-number-card {
                        padding: 1.5rem;
                    }

                    .number-display {
                        font-size: 2.5rem;
                    }
                }

                .key-mapping-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .key-mapping-item {
                    font-size: 0.8rem;
                    padding: 0.2rem;
                    background: #f8f9fa;
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
};

export default Home;