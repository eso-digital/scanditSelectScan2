import React, { Component, createElement, createRef } from 'react';
import { AppState, BackHandler, SafeAreaView, Text, TouchableWithoutFeedback, Image } from 'react-native';
import {
  BarcodeSelection,
  BarcodeSelectionAimerSelection,
  BarcodeSelectionBasicOverlay,
  BarcodeSelectionSettings,
  BarcodeSelectionTapSelection,
  Symbology,
  SymbologyDescription,
} from 'scandit-react-native-datacapture-barcode';
import { Camera, DataCaptureContext, DataCaptureView, FrameSourceState } from 'scandit-react-native-datacapture-core';
import ImageResizer from 'react-native-image-resizer';

import { requestCameraPermissionsIfNeeded } from './camera-permission-handler';

// Enter your Scandit License key here.
// Your Scandit License key is available via your Scandit SDK web account.

const licenseKey = this.props.LicenceKey;
//const licenseKey = 'AaUlUxUlMDHlF+VHIwzhnXgTOLvlOWULCwSqDxE3qXf7acTOhmyj10pWhqnyWVrs7kC4760YbAcMUi1NA1/z6hxAoqM0BIqpBS0l5JAuIJioPtrav2rZVe1fUBfucCJJQDrtGIFv3KQ2X08IVRUlKqZHYqB2Sw8cDkioCgtmdueXfkUscXSrwLdnpnqfZiBsYVk95CxTg1mKBgh6cVqIUlVe4ArQbAk8umpCujJJc75VUZTheWhH5u4Qr6yiWwffc3BDDwxnFpO1YKdTo3D2wHBUutfDdCo5FwNSa/pRC3hQddLzj0ll081SLJtyeMEUNWo/TqAkNZ4pY3dydViaJDJaXGaiV24xu1fJXT5bTjyDRvMLUVN8huxOQJFaVMA8/gDPZZV37jhfR+ubPmFlcM5S6CTaZtZJhEOiv+1BtSlJY/dNtiwE3DN4y3YBcrGRKT5hJqRRk2nnWWHE9ENVE65qeLeUeqOQlWkvjAtDZSekRYnlbX75RBB+EDz2OdqlYFyLYUQNHT4SNwpKvC83sPZhaz//QSYFABnrD1wwg9Lu8KIosuUHfMkKXsyAcXCAIVvQwn+QKBViRp9uT8w5KwYDFYvUOBH32aUZYDSytYuw8A66ensEDvK0yEXmFfIjvCMMBsNidFjrPO739mNE/vlM5nuhyZzE0n2pxjmQUug0cIL5HnWROzXl5clMsxQkILgzIILUAlG8ziVx7mF8cLmrBAvteunBs8bdVkWLKORKZ10zqrHPjJKSz6wm+kSTGRn7HKjlZ/cRPjQ3L1fUnzYLwIVwrlGKAeipXgxBkCwmhYDydVT1P+APrq2Xn+HiLPeSZG+5nGs9bzaj5D12gI8cYgwaP6vnucbN9ezAjQP50ok1j40AuB9TsaK3Pjcz6UA85fxlVqaztcxt9juE6R1aG4daACrpYke5Z1nfLlav6LW1HVk4CFDbePCQI2fMN0YkvvG8kzV8hD3+hxfJgqHiom5ipvRYq305lWGusADy76t9J+hI+VG9DS+DNPhe0lqwcnjxaqZV05r5c4AKULxkS2z7Sta0Onsz4KFxLC+GPtoLddl8vhq8vrrIx1XYbkDOOdoueYwoI1Zbx7G4ixeUJ74dqF7z7SG/fItYU4wJqN2OaD5MwK27a2htPVjEAB8VmfjQXCpGP8d/HfIfccYBfPvoFCctAC8dkduYtsIOycjSN9zh9GACjZCV13LJ4h08OV9qvYXeIw==';

const SelectionType = {
  tap: 'tap',
  aim: 'aim',
}

const executeAction = action => {
  if (action && action.canExecute && !action.isExecuting) {
    action.execute();
  }
}

export default class ScanditSelectScan extends Component {
  state = {
    selectionType: SelectionType.tap,
    result: null
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
      didUpdateSelection: async (_, session, framePromise) => {
        const barcode1 = session.newlySelectedBarcodes[0];

        if (!barcode1) { return }

        const symbology = new SymbologyDescription(barcode1.symbology);
        session.getCount(barcode1).then(count => {
          const result = `Scan Results\n${symbology.readableName}: ${barcode1.data}\nTimes: ${count}`;
          this.setState({ result: result });
          //this.props.barcode.setValue(barcode1.data.toString());
          //executeAction(this.props.onDetect);
          setTimeout(() => {
            this.setState({ result: null });
          }, 2000);
        }); 
        this.props.barcode.setValue(barcode1.data.toString());
        await this.setImageProps(framePromise);
        console.warn('Continuing after setImageProps');
      }
    });

    

    // Add a barcode selection overlay to the data capture view to render the location of captured barcodes on top of
    // the video preview. This is optional, but recommended for better visual feedback.
    const overlay = BarcodeSelectionBasicOverlay.withBarcodeSelectionForView(this.barcodeSelection, this.viewRef.current);

    this.setupSelectionType(this.state.selectionType);
  }

  async setImageProps(getLastFrame) {
    try{
      var frame;
      try {
        frame = await getLastFrame();
      }
      catch(error) {
        console.error('Frame has been consumed before processing. Try again');
        return;
      }

      console.warn('Getting buffer');
      const imageBuffer = frame._imageBuffers[0].data;
      console.warn('Image Buffer:', imageBuffer.slice(0, 30));

      const base64String = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      
      const { width, height } = await new Promise((resolve, reject) => {
        Image.getSize(base64String, (width, height) => {
          resolve({ width, height });
        }, reject);
      });
      console.warn('Got size', width, height);
  
      this.props.height.setValue(height.toString());
      this.props.width.setValue(width.toString());

      console.warn('Set dimensions');
 
      const resizedImage = await ImageResizer.createResizedImage(base64String, width, height, 'JPEG', this.props.compressionPercentage);
      //const fileBuffer = await RNFS.readFile(resizedImage.uri, 'base64');
      this.props.image.setValue(resizedImage.uri);
      executeAction(this.props.onDetect);
    }
    catch(error) {
      console.error('Error saving image. ', error);
    }
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
    if (previousState.selectionType != this.state.selectionType) {
      this.setupSelectionType(this.state.selectionType);
    }
  }

  setupSelectionType(selectionType) {
    if (selectionType == SelectionType.tap) {
      this.barcodeSelectionSettings.selectionType = BarcodeSelectionTapSelection.tapSelection;
      this.barcodeSelection.applySettings(this.barcodeSelectionSettings);
    } else if (selectionType == SelectionType.aim) {
      this.barcodeSelectionSettings.selectionType = BarcodeSelectionAimerSelection.aimerSelection;
      this.barcodeSelection.applySettings(this.barcodeSelectionSettings);
    }
  }

  render() {
    return (
      <>
        <DataCaptureView style={{ flex: 1 }} context={this.dataCaptureContext} ref={this.viewRef}>
        </DataCaptureView>

        <SafeAreaView style={{ width: '100%', backgroundColor: "black", flexDirection: "row", justifyContent: "space-around", alignItems: 'center' }}>
          <TouchableWithoutFeedback onPress={() => this.setState({ selectionType: SelectionType.tap })}>
            <Text style={{ padding: 15, color: this.state.selectionType == SelectionType.tap ? 'white' : 'grey' }}>Tap to Select</Text>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => this.setState({ selectionType: SelectionType.aim })}>
            <Text style={{ padding: 15, color: this.state.selectionType == SelectionType.aim ? 'white' : 'grey' }}>Aim to Select</Text>
          </TouchableWithoutFeedback>
        </SafeAreaView>

        {this.state.result &&
          <Text style={{
            position: 'absolute', top: 100, width: '100%', textAlign: 'center', backgroundColor: '#FFFC', padding: 20,
          }}>{this.state.result}</Text>}
      </>
    );
  };
}
export { ScanditSelectScan };
