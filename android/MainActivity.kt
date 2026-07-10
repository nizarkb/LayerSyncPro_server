package com.example.layerfarm

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.layerfarm.ui.*

// ==========================================
// 1. MATERIAL 3 COLOR THEMING DEFINITION
// ==========================================

private val EmeraldPrimary = Color(0xFF10B981)
private val EmeraldDark = Color(0xFF047857)
private val EmeraldLight = Color(0xFFD1FAE5)

private val SlateBackground = Color(0xFFF8FAFC)
private val SlateTextDark = Color(0xFF0F172A)
private val SlateTextLight = Color(0xFF64748B)

private val AppLightColorScheme = lightColorScheme(
    primary = EmeraldPrimary,
    onPrimary = Color.White,
    primaryContainer = EmeraldLight,
    onPrimaryContainer = EmeraldDark,
    secondary = Color(0xFFF59E0B), // Amber color for vaccination alarms
    onSecondary = Color.White,
    background = SlateBackground,
    onBackground = SlateTextDark,
    surface = Color.White,
    onSurface = SlateTextDark,
    error = Color(0xFFEF4444)
)

@Composable
fun LayerFarmTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AppLightColorScheme,
        typography = Typography(),
        content = content
    )
}

// ==========================================
// 2. MAIN ACTIVITY
// ==========================================

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Edge-to-Edge layouts
        enableEdgeToEdge()
        
        setContent {
            LayerFarmTheme {
                // In your actual app, instantiate using your Room Database instance
                // val db = Room.databaseBuilder(applicationContext, FarmDatabase::class.java, "farm.db").build()
                // val viewModel = FarmViewModel(db.farmDao())
                
                // For direct preview/copy, we represent layout structure here:
                MainAppLayout()
            }
        }
    }
}

// ==========================================
// 3. CORE SCREEN NAVIGATION & LAYOUT
// ==========================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppLayout(viewModel: FarmViewModel = androidx.lifecycle.viewmodel.compose.viewModel()) {
    var activeTab by remember { mutableStateOf("dashboard") }
    
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp,
                modifier = Modifier.height(80.dp) // Generous sizing for 48dp touch targets
            ) {
                NavigationBarItem(
                    selected = activeTab == "dashboard",
                    onClick = { activeTab = "dashboard" },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
                    label = { Text("Beranda", style = MaterialTheme.typography.labelSmall) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldDark,
                        selectedTextColor = EmeraldDark,
                        indicatorColor = EmeraldLight
                    )
                )
                NavigationBarItem(
                    selected = activeTab == "logs",
                    onClick = { activeTab = "logs" },
                    icon = { Icon(Icons.Default.Edit, contentDescription = "Log Harian") },
                    label = { Text("Log Data", style = MaterialTheme.typography.labelSmall) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldDark,
                        selectedTextColor = EmeraldDark,
                        indicatorColor = EmeraldLight
                    )
                )
                NavigationBarItem(
                    selected = activeTab == "health",
                    onClick = { activeTab = "health" },
                    icon = { Icon(Icons.Default.Favorite, contentDescription = "Kesehatan") },
                    label = { Text("Vaksin", style = MaterialTheme.typography.labelSmall) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldDark,
                        selectedTextColor = EmeraldDark,
                        indicatorColor = EmeraldLight
                    )
                )
                NavigationBarItem(
                    selected = activeTab == "biosecurity",
                    onClick = { activeTab = "biosecurity" },
                    icon = { Icon(Icons.Default.Lock, contentDescription = "Biosecurity") },
                    label = { Text("Sanitasi", style = MaterialTheme.typography.labelSmall) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldDark,
                        selectedTextColor = EmeraldDark,
                        indicatorColor = EmeraldLight
                    )
                )
                NavigationBarItem(
                    selected = activeTab == "utilities",
                    onClick = { activeTab = "utilities" },
                    icon = { Icon(Icons.Default.Menu, contentDescription = "Utilitas & Sync") },
                    label = { Text("Menu", style = MaterialTheme.typography.labelSmall) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = EmeraldDark,
                        selectedTextColor = EmeraldDark,
                        indicatorColor = EmeraldLight
                    )
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(SlateBackground)
                .padding(innerPadding)
        ) {
            when (activeTab) {
                "dashboard" -> FarmDashboardScreen(
                    viewModel = viewModel,
                    onNavigateToTab = { tab -> activeTab = tab }
                )
                "logs" -> FarmDataEntryScreen(viewModel = viewModel)
                "health" -> HealthScreen(viewModel = viewModel)
                "biosecurity" -> BiosecurityScreen(viewModel = viewModel)
                "utilities" -> UtilitiesMenuScreen(viewModel = viewModel)
            }
        }
    }
}

// Side Screen helper for nesting Extra menus (Feed Planner, Graph Reports, & Sync configuration)
@Composable
fun UtilitiesMenuScreen(
    viewModel: FarmViewModel,
    modifier: Modifier = Modifier
) {
    var subTab by remember { mutableStateOf("menu") }
    
    when (subTab) {
        "menu" -> Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Peralatan & Integrasi",
                style = MaterialTheme.typography.titleLarge,
                color = SlateTextDark,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            // 1. Feed Planner button
            Button(
                onClick = { subTab = "feed" },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = SlateTextDark),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = "Feed Planner", tint = EmeraldDark)
                        Text("Kalkulator Perencana Pakan", style = MaterialTheme.typography.titleMedium)
                    }
                    Icon(Icons.Default.PlayArrow, contentDescription = "Buka")
                }
            }

            // 2. Graphical Reports button
            Button(
                onClick = { subTab = "reports" },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = SlateTextDark),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(Icons.Default.Star, contentDescription = "Reports", tint = EmeraldDark)
                        Text("Laporan Grafis & Analitik", style = MaterialTheme.typography.titleMedium)
                    }
                    Icon(Icons.Default.PlayArrow, contentDescription = "Buka")
                }
            }

            // 3. Sync Settings button
            Button(
                onClick = { subTab = "sync" },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = SlateTextDark),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sync", tint = EmeraldDark)
                        Text("Sinkronisasi & Koneksi Server", style = MaterialTheme.typography.titleMedium)
                    }
                    Icon(Icons.Default.PlayArrow, contentDescription = "Buka")
                }
            }
        }
        "feed" -> FeedPlannerScreen(onBack = { subTab = "menu" })
        "reports" -> ReportsScreen(viewModel = viewModel, onBack = { subTab = "menu" })
        "sync" -> SyncScreen(viewModel = viewModel, onBack = { subTab = "menu" })
    }
}
