import React, { Component, createElement, createRef } from "react";
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

//const licenseKey = this.props.LicenceKey;
const licenseKey = "AVZ0QT8EGjghLUEgsA7SdiIJ0uLtD41dKwkKZ4ItOpATcdzJe17+YqtUF2Dxd2Q7bzNdQ6MmCCTIELZLpnHEOWJRFd3lM+foxDzU2jo1eo8aPDtuG3X/NgdfonIREm53M0WFrtZHHzPAfqVgbSj1fQVN9rfoZoqTeyzEmfME939lcGlVnlchNK1MXtiJdx9luBs8155SFUDXExN3j27cVWZU22NxbvAFLiDPBoYvrojYEAB9Klhm29FHoSz9RbHNLUK2QgdeLhNGRPX4tHTSWoFm7DnwaV8VHFh4hFV9obkeAf7MsCn/xZQD9zuAfSbpMEXLzGBks1X7GuYnEXcyrdR9tEtQVyoXR08BkUBVdvv4BXuoX2Ksyy4KlGR+TGITJyBLv11YaVcuN8FzmU4GPfQhYJO6VjhnEA6hE1AxSoj+UUw5DV8qRCdO6QgBc+PD0XCfhsNpJIpDe5J08gBPwD5hleo1YjMpDnietlcs1PcLG/8sh2rN1pRwFdInXMpafEN5YeUn9YqncZXWMHmMEY83cJQ0aCOgT0Nv1keiLMLWrFVwyoLdT0LoCeCYVBJtXboXPIymg19X3JDdUQtgF6GEQyKgrIOR1CvioRAaLKzQIwo4BeSIT8N13YdTcAsMXOr09csUY/mQCKYPMzFvdUfRctriDAVF2pfiIK7rdImNqAS57RTvRw3I/BJytkk5NG6p5PelF/0fry6IRNvMvAKyEoWYg8DrN7E4TCmrUX5X1hi7f8IvScFtVJrCHnb/A9uM4Gn5ZDkwqtRoozMoLE6//oEtugNj7yFQRI2wPYeKwrySiwMxI7lWo7/AClA1CKhJv3i01Ix+ARGpvgxn/wLZDjvZxFUbSczM7ABF410fF5d3rtpv6iwP4k5003MlFrVG44ZpChUDtca3p6XF4gRi44RfMy0YZOh03MsCxmEMAyrox3GrsAf3HgefOdOkh0Mb6tiQONp3T7pXKETR8jM7U89WrYc0qL41SWX+/q9rSgJSl1wsDYAknNjOLPJePijv5kVxPgzPoBXMOAHXW8Hdyawljzl+d/FvNlL/BJM5h1SlNbIjMLP2bqTuFcIzehRB08vAbZGnvSnVu0ZQ+bbdjTc4E3E/0xfz/qg3WEjKxbx1C0sJrJAqL03meiNvoOdLvldL/uU19DbQbQhBEz6BPhnjsVuEsiMkilv1aR+VZglF97TRXwmegMXAE5olpfJ84USMd/9TCrNr";

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
    result: null,
    imageHeight: undefined,
    imageWidth: undefined
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
      didUpdateSelection: (barcodeSelection, session, _) => {
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
          }, 500);
        }); 
        this.props.barcode.setValue(barcode1.data.toString());
        this.setImageProps(_);
        executeAction(this.props.onDetect);
      }
    });

    

    // Add a barcode selection overlay to the data capture view to render the location of captured barcodes on top of
    // the video preview. This is optional, but recommended for better visual feedback.
    const overlay = BarcodeSelectionBasicOverlay.withBarcodeSelectionForView(this.barcodeSelection, this.viewRef.current);

    this.setupSelectionType(this.state.selectionType);
  }

  async setImageProps(getLastFrame) {
    try{
      const frame = await getLastFrame();
      const imageBuffer = frame._imageBuffers[0].data;
 
      const base64String = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
 
      await Image.getSize(base64String, (width, height) => {
        this.setState({ imageWidth: width, imageHeight: height });
        this.props.height.setValue(height);
        this.props.width.setValue(width);
 
      })
      .catch(error => {
        console.error('Error getting image size: ', error);
      });
 
      ImageResizer.createResizedImage(base64String, this.state.imageWidth, this.state.imageHeight, 'JPEG', 25)
        .then(resizedImage => {
          this.props.image.setValue(resizedImage);
        })
        .catch(error => {
          console.error('Error compressing image: ', error);
        });
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