package com.frontend.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.util.concurrent.ConcurrentHashMap

class BluetoothScanModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    override fun getName(): String = "BluetoothScanModule"

    private val bluetoothManager: BluetoothManager? =
        reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager?.adapter

    private val foundDevices = ConcurrentHashMap<String, WritableMap>()
    private var scanPromise: Promise? = null
    private var bleScanCallback: ScanCallback? = null
    private var classicReceiver: BroadcastReceiver? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        reactContext.addLifecycleEventListener(this)
    }

    @ReactMethod
    fun isBluetoothEnabled(promise: Promise) {
        promise.resolve(bluetoothAdapter?.isEnabled == true)
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun startScan(durationMs: Int, promise: Promise) {
        if (bluetoothAdapter == null) {
            promise.reject("NO_ADAPTER", "Bluetooth is not supported on this device.")
            return
        }
        if (!bluetoothAdapter.isEnabled) {
            promise.reject("BT_OFF", "Bluetooth is turned off. Enable it in Settings.")
            return
        }

        stopScanInternal()
        foundDevices.clear()
        scanPromise = promise

        classicReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    BluetoothDevice.ACTION_FOUND -> {
                        val device = getDeviceFromIntent(intent)
                        device?.let { addDevice(it, "classic") }
                    }
                }
            }
        }

        val filter = IntentFilter().apply {
            addAction(BluetoothDevice.ACTION_FOUND)
            addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
        }
        reactContext.registerReceiver(classicReceiver, filter)

        if (bluetoothAdapter.isDiscovering) {
            bluetoothAdapter.cancelDiscovery()
        }
        bluetoothAdapter.startDiscovery()

        bleScanCallback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult?) {
                result?.device?.let { addDevice(it, "ble") }
            }

            override fun onBatchScanResults(results: MutableList<ScanResult>?) {
                results?.forEach { result -> result.device?.let { addDevice(it, "ble") } }
            }
        }
        bluetoothAdapter.bluetoothLeScanner?.startScan(bleScanCallback)

        mainHandler.postDelayed({ finishScan() }, durationMs.toLong().coerceAtLeast(3000))
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun stopScan(promise: Promise) {
        finishScan()
        promise.resolve(true)
    }

    @SuppressLint("MissingPermission")
    private fun addDevice(device: BluetoothDevice, scanType: String) {
        val id = device.address ?: return
        val existing = foundDevices[id]
        val name = device.name ?: device.address ?: "Unknown Device"

        val map = Arguments.createMap()
        map.putString("id", id)
        map.putString("name", name)
        map.putString("address", id)

        if (existing != null) {
            val existingType = existing.getString("type")
            map.putString("type", if (existingType != scanType) "dual" else scanType)
        } else {
            map.putString("type", scanType)
        }

        foundDevices[id] = map
    }

    @SuppressLint("MissingPermission")
    private fun finishScan() {
        stopScanInternal()
        val array = Arguments.createArray()
        foundDevices.values.forEach { array.pushMap(it) }
        scanPromise?.resolve(array)
        scanPromise = null
    }

    @SuppressLint("MissingPermission")
    private fun stopScanInternal() {
        bleScanCallback?.let { callback ->
            bluetoothAdapter?.bluetoothLeScanner?.stopScan(callback)
        }
        bleScanCallback = null

        if (bluetoothAdapter?.isDiscovering == true) {
            bluetoothAdapter.cancelDiscovery()
        }

        classicReceiver?.let {
            try {
                reactContext.unregisterReceiver(it)
            } catch (_: Exception) {
            }
        }
        classicReceiver = null
    }

    private fun getDeviceFromIntent(intent: Intent): BluetoothDevice? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
        }
    }

    override fun onHostResume() {}

    override fun onHostPause() {}

    override fun onHostDestroy() {
        stopScanInternal()
    }
}
