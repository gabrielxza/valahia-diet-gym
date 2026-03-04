package com.valahia.dietgym;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.content.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(strings = { "android.permission.ACTIVITY_RECOGNITION" }, alias = "activityRecognition")
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepCounterSensor;
    private long lastKnownSteps = -1;
    private boolean listenerRegistered = false;

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", stepCounterSensor != null);
        call.resolve(result);
    }

    /**
     * Starts the persistent sensor listener (call after permission granted).
     * getStepCount() will return -1 until the user takes at least one step.
     */
    @PluginMethod
    public void startTracking(PluginCall call) {
        if (stepCounterSensor == null) {
            call.reject("Sensore passi non disponibile su questo dispositivo");
            return;
        }
        if (!listenerRegistered) {
            sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_NORMAL);
            listenerRegistered = true;
        }
        call.resolve();
    }

    /**
     * Returns the last known step count immediately (never hangs).
     * Returns { steps: -1, ready: false } if sensor has not fired yet.
     */
    @PluginMethod
    public void getStepCount(PluginCall call) {
        if (stepCounterSensor == null) {
            call.reject("Sensore passi non disponibile su questo dispositivo");
            return;
        }
        // Ensure listener is running
        if (!listenerRegistered) {
            sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_NORMAL);
            listenerRegistered = true;
        }
        JSObject result = new JSObject();
        result.put("steps", lastKnownSteps);
        result.put("ready", lastKnownSteps >= 0);
        call.resolve(result);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            lastKnownSteps = (long) event.values[0];
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    protected void handleOnDestroy() {
        if (listenerRegistered) {
            sensorManager.unregisterListener(this);
            listenerRegistered = false;
        }
    }
}
