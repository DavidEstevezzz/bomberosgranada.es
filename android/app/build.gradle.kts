plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "es.bomberosgranada.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "es.bomberosgranada.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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
    // Compose y Android básico (lo que ya tenías)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)

    // ============ NUEVAS DEPENDENCIAS ============

    // Para hacer llamadas a tu API Laravel
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // Para ver los logs de las llamadas HTTP (debugging)
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Para trabajar con código asíncrono (obligatorio para APIs)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Para navegar entre pantallas
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Para íconos de Material (usuario, contraseña, etc)
    implementation("androidx.compose.material:material-icons-extended:1.6.3")

    // Para guardar datos localmente (token, sesión)
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // ============ TESTS (lo que ya tenías) ============
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}