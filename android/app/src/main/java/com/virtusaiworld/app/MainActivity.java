package com.virtusaiworld.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(6, 24, 22));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(6, 24, 22));
        if (android.os.Build.VERSION.SDK_INT >= 29) {
            getWindow().getAttributes();
            getWindow().getDecorView().setSystemUiVisibility(0);
            getWindow().setNavigationBarDividerColor(android.graphics.Color.rgb(6, 24, 22));
        }
    }
}
