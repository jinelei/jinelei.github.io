---
title:  "iOS集成react-native"
date: 2018-05-23 09:00:00
categories:
  - RectNative
tags:
  - 学习笔记
---

1. 新建react-native工程

```react-native init demo --version 0.44.3```
> 注意这里指定了版本的react-native，高版本的react-native可能会编译错误主要是自己太菜了。




2. 删除ios目录下的文件，拷贝从xcode创建的新工程的文件到ios目录下，并添加PodFile，样例如下:

```
platform :ios, '8.0'
use_frameworks!

# target的名字一般与你的项目名字相同，我这里项目名是demo
target 'demo' do

  # 'node_modules'目录一般位于根目录中
  # 但是如果你的结构不同，那你就要根据实际路径修改下面的`:path`
  pod 'React', :path => '../node_modules/react-native', :subspecs => [
    'Core',
    'DevSupport', # 如果RN版本 >= 0.43，则需要加入此行才能开启开发者菜单
    'RCTText',
    'RCTNetwork',
    'RCTWebSocket', # 这个模块是用于调试功能的
    # 在这里继续添加你所需要的RN模块
  ]
  # 如果你的RN版本 >= 0.42.0，则加入下面这行
  pod "Yoga", :path => "../node_modules/react-native/ReactCommon/yoga"

end

```

3. 执行```pod install```安装依赖，安装完成后会产生Pods、Podfile.lock等文件。

4. 使用xcode打开```demo.xcworkspac```文件，添加一对ViewController，命名为RNViewController.h、RNViewController.m，文件内容如下：

RNViewController.h
```
#import <Foundation/Foundation.h>
#import <React/RCTRootView.h>


@interface RNViewController : UIViewController

@end
```

RNViewController.m
```
#import "RNViewController.h"

@implementation RNViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    NSString * strUrl = @"http://localhost:8081/index.ios.bundle?platform=ios&dev=true";
    NSURL * jsCodeLocation = [NSURL URLWithString:strUrl];
    RCTRootView * rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                         moduleName:@"demo"
                                                  initialProperties:nil
                                                      launchOptions:nil];
    self.view = rootView;
    // Do any additional setup after loading the view.
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
@end
```

5. 添加布局（由于ios不熟，所以使用了```main.storyboard```编辑，内容如下：

```
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="11762" systemVersion="16B2657" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" useTraitCollections="YES" colorMatched="YES" initialViewController="Gb4-UD-klr">
    <device id="retina4_7" orientation="portrait">
        <adaptation id="fullscreen"/>
    </device>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="11757"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--Navigation Controller-->
        <scene sceneID="jZv-Eb-kDK">
            <objects>
                <navigationController id="Gb4-UD-klr" sceneMemberID="viewController">
                    <navigationBar key="navigationBar" contentMode="scaleToFill" id="Th1-FI-dxd">
                        <rect key="frame" x="0.0" y="0.0" width="375" height="44"/>
                        <autoresizingMask key="autoresizingMask"/>
                    </navigationBar>
                    <connections>
                        <segue destination="BYZ-38-t0r" kind="relationship" relationship="rootViewController" id="UwD-kE-QAJ"/>
                    </connections>
                </navigationController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="ma8-aZ-VDt" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="-823" y="127"/>
        </scene>
        <!--我是原生界面-->
        <scene sceneID="tne-QT-ifu">
            <objects>
                <viewController id="BYZ-38-t0r" customClass="ViewController" sceneMemberID="viewController">
                    <layoutGuides>
                        <viewControllerLayoutGuide type="top" id="y3c-jy-aDJ"/>
                        <viewControllerLayoutGuide type="bottom" id="wfy-db-euE"/>
                    </layoutGuides>
                    <view key="view" contentMode="scaleToFill" id="8bC-Xf-vdC">
                        <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" buttonType="roundedRect" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="ewF-NN-AX5">
                                <rect key="frame" x="139.5" y="318.5" width="97" height="30"/>
                                <state key="normal" title="跳转至RN界面"/>
                                <connections>
                                    <segue destination="uMO-xq-gw5" kind="show" id="PLm-J8-SMi"/>
                                </connections>
                            </button>
                        </subviews>
                        <color key="backgroundColor" red="1" green="1" blue="1" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>
                            <constraint firstItem="ewF-NN-AX5" firstAttribute="centerY" secondItem="8bC-Xf-vdC" secondAttribute="centerY" id="DvG-OV-XSx"/>
                            <constraint firstItem="ewF-NN-AX5" firstAttribute="centerX" secondItem="8bC-Xf-vdC" secondAttribute="centerX" id="QE6-XL-9yD"/>
                        </constraints>
                    </view>
                    <navigationItem key="navigationItem" title="我是原生界面" id="A0r-tB-PNQ"/>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="dkx-z0-nzr" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="20" y="129"/>
        </scene>
        <!--RN界面-->
        <scene sceneID="blN-Cj-XZY">
            <objects>
                <viewController id="uMO-xq-gw5" customClass="RNViewController" sceneMemberID="viewController">
                    <layoutGuides>
                        <viewControllerLayoutGuide type="top" id="xBa-QW-gat"/>
                        <viewControllerLayoutGuide type="bottom" id="vP4-I2-cUk"/>
                    </layoutGuides>
                    <view key="view" contentMode="scaleToFill" id="F5L-mW-jGp">
                        <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <color key="backgroundColor" white="1" alpha="1" colorSpace="calibratedWhite"/>
                    </view>
                    <navigationItem key="navigationItem" title="RN界面" id="8QR-M3-z3d"/>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="OGb-HK-HWZ" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="764" y="128"/>
        </scene>
    </scenes>
</document>
```

6. 添加以下内容到```Info.plist```以访问http：
```
    <key>NSAppTransportSecurity</key>
    <!--See http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/ -->
    <dict>
        <key>NSExceptionDomains</key>
        <dict>
            <key>localhost</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <true/>
            </dict>
        </dict>
    </dict>
```

7. 根目录下运行```npm start```和```react-native run-ios```
