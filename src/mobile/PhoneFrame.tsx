import {
  createContext,
  type CSSProperties,
  type DragEvent,
  type PropsWithChildren,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DevicePicker, useMobileDevice } from "./Device";
import { useMobileCursor } from "./MobileCursor";

type ScreenPortalContextValue = {
  screenRef: RefObject<HTMLDivElement | null>;
};

const ScreenPortalContext = createContext<ScreenPortalContextValue | null>(null);
const NativeViewportContext = createContext(false);

function suppressNativeDrag(event: DragEvent<HTMLElement>) {
  if (event.target instanceof Element && event.target.closest('[data-native-drag="true"]')) {
    return;
  }

  event.preventDefault();
}

export function useScreenPortal() {
  const context = useContext(ScreenPortalContext);

  if (!context) {
    throw new Error("useScreenPortal must be used inside PhoneFrame");
  }

  return context;
}

export function useNativeViewport() {
  return useContext(NativeViewportContext);
}

function getNativeViewportMode() {
  if (typeof window === "undefined") return false;

  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const compactTouch = window.matchMedia("(max-width: 700px) and (pointer: coarse)").matches;

  return standalone || compactTouch;
}

function useNativeViewportMode() {
  const [nativeViewport, setNativeViewport] = useState(getNativeViewportMode);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const compactTouch = window.matchMedia("(max-width: 700px) and (pointer: coarse)");
    const update = () => setNativeViewport(getNativeViewportMode());

    standalone.addEventListener("change", update);
    compactTouch.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      standalone.removeEventListener("change", update);
      compactTouch.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return nativeViewport;
}

function getDeviceScale(deviceWidth: number, deviceHeight: number) {
  if (typeof window === "undefined") return 1;

  const horizontal = (window.innerWidth - 48) / deviceWidth;
  const vertical = (window.innerHeight - 48) / deviceHeight;

  return Math.max(0.42, Math.min(horizontal, vertical, 1));
}

function useDeviceScale(deviceWidth: number, deviceHeight: number) {
  const [scale, setScale] = useState(() => getDeviceScale(deviceWidth, deviceHeight));

  useEffect(() => {
    const update = () => setScale(getDeviceScale(deviceWidth, deviceHeight));

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [deviceHeight, deviceWidth]);

  return scale;
}

export function PhoneFrame({ children }: PropsWithChildren) {
  const { device } = useMobileDevice();
  const { geometry } = device;
  const nativeViewport = useNativeViewportMode();
  const scale = useDeviceScale(geometry.device.width, geometry.device.height);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const contextValue = useMemo(() => ({ screenRef }), []);
  const mobileCursor = useMobileCursor();

  return (
    <NativeViewportContext.Provider value={nativeViewport}>
      <ScreenPortalContext.Provider value={contextValue}>
      <div className="phone-stage" data-native-viewport={nativeViewport ? "true" : "false"}>
        {nativeViewport ? null : <DevicePicker />}
        <div
          className="phone-scale-box"
          style={{
            width: nativeViewport ? "100%" : geometry.device.width * scale,
            height: nativeViewport ? "100%" : geometry.device.height * scale,
          }}
        >
          <div
            className="phone-device"
            data-device={device.id}
            data-platform={device.platform}
            data-testid="phone-frame"
            onDragStartCapture={suppressNativeDrag}
            style={{
              width: nativeViewport ? "100%" : geometry.device.width,
              height: nativeViewport ? "100%" : geometry.device.height,
              transform: nativeViewport ? "none" : `scale(${scale})`,
            }}
          >
            {nativeViewport ? null : <img
              className="phone-bezel"
              src={device.bezel}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{ zIndex: device.bezelLayer === "above-screen" ? 2 : 1 }}
            />}
            <div
              ref={screenRef}
              className="device-screen"
              data-cursor-debug={mobileCursor.cursorDebug ? "true" : "false"}
              data-device={device.id}
              data-phone-screen
              data-testid="device-screen"
              {...(nativeViewport ? {} : mobileCursor.cursorHandlers)}
              style={
                nativeViewport
                  ? ({
                      "--device-safe-area-top": "env(safe-area-inset-top, 0px)",
                      "--device-safe-area-bottom": "env(safe-area-inset-bottom, 0px)",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      borderRadius: 0,
                      zIndex: 1,
                    } as CSSProperties)
                  : ({
                      "--device-safe-area-bottom": `${geometry.safeArea.bottom}px`,
                      left: geometry.screen.x,
                      top: geometry.screen.y,
                      width: geometry.screen.width,
                      height: geometry.screen.height,
                      borderRadius: geometry.screen.radius,
                      zIndex: device.bezelLayer === "above-screen" ? 1 : 2,
                    } as CSSProperties)
              }
            >
              {children}
              {!nativeViewport && device.camera ? (
                <span
                  className="device-camera"
                  data-testid="device-camera"
                  aria-hidden="true"
                  style={{
                    width: device.camera.size,
                    height: device.camera.size,
                    top: device.camera.top,
                    left: `calc(50% - ${device.camera.size / 2}px)`,
                  }}
                />
              ) : null}
              {nativeViewport ? null : mobileCursor.cursorElement}
            </div>
          </div>
        </div>
      </div>
      </ScreenPortalContext.Provider>
    </NativeViewportContext.Provider>
  );
}
