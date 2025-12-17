import com.android.build.gradle.internal.cxx.configure.gradleLocalProperties
import org.gradle.api.GradleException

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

val localProperties = gradleLocalProperties(rootDir, providers)
val keystoreStorePassword = (project.findProperty("keystoreStorePassword") as String?)
    ?: localProperties.getProperty("keystoreStorePassword")
val keystoreAlias = (project.findProperty("keystoreAlias") as String?)
    ?: localProperties.getProperty("keystoreAlias")
val keystoreKeyPassword = (project.findProperty("keystoreKeyPassword") as String?)
    ?: localProperties.getProperty("keystoreKeyPassword")
val hasSigningCredentials = listOf(keystoreStorePassword, keystoreAlias, keystoreKeyPassword).all { it != null }


android {
    namespace = "es.bomberosgranada.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "es.bomberosgranada.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            if (!hasSigningCredentials) {
                throw GradleException(
                    "Define keystoreStorePassword, keystoreAlias y keystoreKeyPassword en gradle.properties o local.properties para firmar el APK de release."
                )
            }

            storeFile = file("bomberos-release.jks")
            storePassword = keystoreStorePassword
            keyAlias = keystoreAlias
            keyPassword = keystoreKeyPassword
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)

    implementation("androidx.navigation:navigation-compose:2.8.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.4")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")

    // Para guardar datos localmente (token, sesión)
    implementation("androidx.datastore:datastore-preferences:1.1.1")


    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)


}