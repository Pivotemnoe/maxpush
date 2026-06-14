import java.net.URI
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val defaultApiBaseUrl = providers.gradleProperty("maxPushApiBaseUrl").orElse("https://notifymax.ru").get().trimEnd('/')
val allowedApiHost = URI(defaultApiBaseUrl).host ?: "notifymax.ru"
val allowQrBaseUrlOverride = providers.gradleProperty("maxPushAllowQrBaseUrlOverride").orElse("false").get()
val allowCleartextTraffic = providers.gradleProperty("maxPushAllowCleartextTraffic").orElse(allowQrBaseUrlOverride).get()
val signingProperties = Properties()
val signingPropertiesFile = rootProject.file("signing.local.properties")
if (signingPropertiesFile.exists()) {
    signingPropertiesFile.inputStream().use(signingProperties::load)
}
fun releaseSigningValue(name: String): String? {
    return providers.gradleProperty(name).orNull
        ?: System.getenv(name.uppercase().replace('.', '_'))
        ?: signingProperties.getProperty(name)
}
val releaseStoreFile = releaseSigningValue("maxPushReleaseStoreFile")
val releaseStorePassword = releaseSigningValue("maxPushReleaseStorePassword")
val releaseKeyAlias = releaseSigningValue("maxPushReleaseKeyAlias")
val releaseKeyPassword = releaseSigningValue("maxPushReleaseKeyPassword")
val hasReleaseSigning = listOf(releaseStoreFile, releaseStorePassword, releaseKeyAlias, releaseKeyPassword).all { !it.isNullOrBlank() }

android {
    namespace = "ru.temichev.maxpush"
    compileSdk = 35

    defaultConfig {
        applicationId = "ru.temichev.maxpush"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "0.1.1"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "DEFAULT_API_BASE_URL", "\"$defaultApiBaseUrl\"")
        buildConfigField("String", "ALLOWED_API_HOST", "\"$allowedApiHost\"")
        buildConfigField("boolean", "ALLOW_QR_BASE_URL_OVERRIDE", allowQrBaseUrlOverride)
        manifestPlaceholders["usesCleartextTraffic"] = allowCleartextTraffic
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = rootProject.file(releaseStoreFile!!)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
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
