import React, { Component, createElement, createRef } from 'react';
import { AppState, BackHandler, Text } from 'react-native';
import {
  BarcodeSelection,
  BarcodeSelectionAimerSelection,
  BarcodeSelectionBasicOverlay,
  BarcodeSelectionSettings,
  Symbology,
  SymbologyDescription,
} from 'scandit-react-native-datacapture-barcode';
import { Camera, DataCaptureContext, DataCaptureView, FrameSourceState } from 'scandit-react-native-datacapture-core';
import ViewShot from 'react-native-view-shot';

import { requestCameraPermissionsIfNeeded } from './camera-permission-handler';

// Enter your Scandit License key here.
// Your Scandit License key is available via your Scandit SDK web account.

const licenseKey = this.props.LicenceKey;

const executeAction = action => {
  if (action && action.canExecute && !action.isExecuting) {
    action.execute();
  }
}

export default class ScanditSelectScan extends Component {
  state = {
    result: null,
    barcodes: []
  }

  constructor(props) {
    super(props);
    this.dataCaptureContext = DataCaptureContext.forLicenseKey(licenseKey);
    this.viewRef = createRef();
  }

  async componentDidMount() {
    this.handleAppStateChangeSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    this.startCamera();

    // The barcode selection process is configured through barcode selection settings
    // and are then applied to the barcode selection instance that manages barcode recognition.
    this.barcodeSelectionSettings = new BarcodeSelectionSettings();

    // The settings instance initially has all types of barcodes (symbologies) disabled. For the purpose of this
    // sample we enable a very generous set of symbologies. In your own app ensure that you only enable the
    // symbologies that your app requires as every additional enabled symbology has an impact on processing times.
    this.barcodeSelectionSettings.enableSymbologies([
      Symbology.EAN13UPCA,
      Symbology.EAN8,
      Symbology.UPCE,
      Symbology.QR,
      Symbology.DataMatrix,
      Symbology.Code39,
      Symbology.Code128,
      Symbology.ArUco,
      Symbology.Code11,
      Symbology.Code25,
      Symbology.Code32,
      Symbology.Code39,
      Symbology.Code93,
      Symbology.Upu4State,
    ]);

    // Create new barcode selection mode with the settings from above.
    this.barcodeSelection = BarcodeSelection.forContext(this.dataCaptureContext, this.barcodeSelectionSettings);

    // Register a listener to get informed whenever a new barcode got recognized.
    this.barcodeSelection.addListener({
      didUpdateSelection: async (_, session, frame) => {
        const barcode1 = session.newlySelectedBarcodes[0];

        if (!barcode1) { return }

        if (!this.state.barcodes.includes(barcode1.data)) {
          this.setState(prevState => ({
            barcodes: [...prevState.barcodes, barcode1.data]
          }));
        }
        else { return }

        const symbology = new SymbologyDescription(barcode1.symbology);

        this.viewRef.current?.removeOverlay(this.overlay);

        ViewShot.captureRef(this.viewRef, {
          format: "jpg",
          quality: 0.25,
        })
        .then(uri => {
          this.viewRef.current.addOverlay(this.overlay);

          Image.getSize(uri, (width, height) => {
            console.warn('Image size:', width, height);
            this.props.width.setValue(width.toString());
            this.props.height.setValue(height.toString());
            this.props.image.setValue(uri);
          }, error => {
            console.error("Failed to get image size:", error);
          });
        })
        .catch(error => {
          console.error("Failed to capture view:", error);
        });

        this.props.barcode.setValue(barcode1.data.toString());
        console.warn('Widget finished: ' + barcode1.data);
        executeAction(this.props.onDetect);
      }
    });

    // Add a barcode selection overlay to the data capture view to render the location of captured barcodes on top of
    // the video preview. This is optional, but recommended for better visual feedback.
    const overlay = BarcodeSelectionBasicOverlay.withBarcodeSelectionForView(this.barcodeSelection, this.viewRef.current);

    this.barcodeSelectionSettings.selectionType = BarcodeSelectionAimerSelection.aimerSelection;
    this.barcodeSelectionSettings.selectionType.selectionStrategy.type = "autoSelectionStrategy";
    this.barcodeSelection.applySettings(this.barcodeSelectionSettings);
  }

  componentWillUnmount() {
    this.handleAppStateChangeSubscription.remove();
    this.dataCaptureContext.dispose();
  }

  handleAppStateChange = async (nextAppState) => {
    if (nextAppState.match(/inactive|background/)) {
      this.stopCamera();
    } else {
      this.startCamera();
    }
  }

  stopCamera() {
    if (this.camera) {
      this.camera.switchToDesiredState(FrameSourceState.Off);
    }
  }

  startCamera() {
    if (!this.camera) {
      this.camera = Camera.withSettings(BarcodeSelection.recommendedCameraSettings);
      this.dataCaptureContext.setFrameSource(this.camera);
    }

    requestCameraPermissionsIfNeeded()
      .then(() => this.camera.switchToDesiredState(FrameSourceState.On))
      .catch(() => BackHandler.exitApp());
  }

  componentDidUpdate(_, previousState) {
  }

  render() {
    return (
      <>
        <DataCaptureView style={{ flex: 1 }} context={this.dataCaptureContext} ref={this.viewRef}>
        </DataCaptureView>

        {this.state.result &&
          <Text style={{
            position: 'absolute', top: 100, width: '100%', textAlign: 'center', backgroundColor: '#FFFC', padding: 20,
          }}>{this.state.result}</Text>}
      </>
    );
  };
}
export { ScanditSelectScan };
