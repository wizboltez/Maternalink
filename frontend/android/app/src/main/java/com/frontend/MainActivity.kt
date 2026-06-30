package com.frontend

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  private var screenToggleReceiver: BroadcastReceiver? = null
  private var lastToggleTime = 0L
  private var toggleCount = 0

  override fun getMainComponentName(): String = "Maternalink"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    registerScreenToggleReceiver()
  }

  override fun onDestroy() {
    unregisterScreenToggleReceiver()
    super.onDestroy()
  }

  private fun registerScreenToggleReceiver() {
    screenToggleReceiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context?, intent: Intent?) {
        when (intent?.action) {
          Intent.ACTION_SCREEN_ON, Intent.ACTION_SCREEN_OFF -> {
            val now = System.currentTimeMillis()
            if (now - lastToggleTime <= 1500) {
              toggleCount++
            } else {
              toggleCount = 1
            }
            lastToggleTime = now
            if (toggleCount >= 2) {
              toggleCount = 0
              sendHardwareSosEvent()
            }
          }
        }
      }
    }

    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_ON)
      addAction(Intent.ACTION_SCREEN_OFF)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(screenToggleReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(screenToggleReceiver, filter)
    }
  }

  private fun unregisterScreenToggleReceiver() {
    screenToggleReceiver?.let {
      try {
        unregisterReceiver(it)
      } catch (_: Exception) {
      }
    }
    screenToggleReceiver = null
  }

  private fun sendHardwareSosEvent() {
    val reactContext = reactInstanceManager.currentReactContext ?: return
    val params = Arguments.createMap()
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("HardwareSOSTriggered", params)
  }
}
