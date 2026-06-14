import java.net.URI

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val defaultApiBaseUrl = providers.gradleProperty("maxPushApiBaseUrl").orElse("https://notifymax.ru").get().trimEnd('/')
val allowedApiHost = URI(defaultApiBaseUrl).host ?: "notifymax.ru"
val allowQrBaseUrlOverride = providers.gradleProperty("maxPushAllowQrBaseUrlOverride").orElse("false").get()
val allowCleartextTraffic = providers.gradleProperty("maxPushAllowCleartextTraffic").orElse(allowQrBaseUrlOverride).get()

android {
    namespace = "ru.temichev.maxpush"
    compileSdk = 35

    defaultConfig {
        applicationId = "ru.temichev.maxpush"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "DEFAULT_API_BASE_URL", "\"$defaultApiBaseUrl\"")
        buildConfigField("String", "ALLOWED_API_HOST", "\"$allowedApiHost\"")
        buildConfigField("boolean", "ALLOW_QR_BASE_URL_OVERRIDE", allowQrBaseUrlOverride)
        manifestPlaceholders["usesCleartextTraffic"] = allowCleartextTraffic
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.camera:camera-core:1.4.0")
    implementation("androidx.camera:camera-camera2:1.4.0")
    implementation("androidx.camera:camera-lifecycle:1.4.0")
    implementation("androidx.camera:camera-view:1.4.0")
    implementation("com.google.mlkit:barcode-scanning:17.3.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    testImplementation("junit:junit:4.13.2")
}
