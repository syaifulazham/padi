import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const DICTS = {
  en: {
    app: {
      loading: 'Loading...',
      dbConnectionFailedTitle: '❌ Database Connection Failed',
      dbConnectionFailedBody: 'Please check your database configuration and ensure MySQL is running.',
      retryConnection: 'Retry Connection'
    },
    topNav: {
      season: '🌾 Season',
      totalPurchases: '📦 Total Purchases',
      inInventory: '📊 In Inventory',
      soldToManufacturers: '🚚 Sold to Manufacturers',
      welcome: 'Welcome, Admin',
      currentPrices: '💰 Current Prices:',
      perTon: 'Per Ton:',
      perKg: 'Per KG:',
      clickToUpdatePrice: 'Click to update price',
      noPricesSet: 'No prices set',
      noActiveSeason: 'No active season',
      mode: 'Mode:',
      modes: {
        operation: 'Operation',
        management: 'Management'
      },
      updatePriceTitle: 'Update Price - {productName}',
      updatePriceOk: 'Update Price',
      pricePerTonLabel: 'Price per Ton (RM)',
      priceRequired: 'Please enter price',
      pricePositive: 'Price must be positive',
      pricePlaceholder: 'e.g., 850.00',
      pricePerKgLabel: 'Price per KG:'
    },
    dashboard: {
      totalFarmers: 'Total Farmers',
      todaysPurchases: "Today's Purchases",
      currentStockKg: 'Current Stock (kg)',
      todaysAmount: "Today's Amount",
      recentPurchases: 'Recent Purchases',
      receipt: 'Receipt',
      farmer: 'Farmer',
      product: 'Product',
      weightKg: 'Weight (kg)',
      amountRm: 'Amount (RM)',
      date: 'Date'
    },
    farmers: {
      loadFailed: 'Failed to load farmers',
      loadError: 'Error loading farmers',
      searchFailed: 'Search failed',
      found: 'Found: {fullName} ({farmerCode})',
      couldNotLoadDetails: 'Could not load farmer details',
      notFoundQr: 'No farmer found with this QR code',
      searchByQrFailed: 'Failed to search by QR code: {error}',
      columns: {
        subsidyNo: 'Subsidy No.',
        icNumber: 'IC Number',
        fullName: 'Full Name',
        phone: 'Phone',
        city: 'City',
        farmSizeAcres: 'Farm Size (acres)',
        status: 'Status',
        actions: 'Actions'
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        deleteComingSoon: 'Delete feature coming soon'
      },
      searchPlaceholder: 'Search farmers...',
      search: 'Search',
      scanQr: 'Scan QR',
      scanQrTitle: 'Scan QR code to search farmer',
      addFarmer: 'Add Farmer',
      bulkUpload: 'Bulk Upload',
      paginationTotal: 'Total {total} farmers',
      modal: {
        editTitle: 'Edit Farmer',
        addTitle: 'Add New Farmer',
        updateOk: 'Update Farmer',
        addOk: 'Add Farmer',
        cancel: 'Cancel',
        tabs: {
          details: 'Farmer Details',
          subsidyCard: 'Subsidy Card'
        },
        fields: {
          farmerCode: 'Subsidy No.',
          icNumber: 'IC Number',
          fullName: 'Full Name',
          phoneNumber: 'Phone Number',
          dateOfBirth: 'Date of Birth',
          address: 'Address',
          postcode: 'Postcode',
          city: 'City',
          state: 'State',
          bankName: 'Bank Name',
          bankAccountNumber: 'Bank Account Number',
          bankName2Optional: 'Bank Name 2 (Optional)',
          bankAccountNumber2: 'Bank Account Number 2',
          farmSizeAcres: 'Farm Size (Acres)',
          status: 'Status',
          notes: 'Notes'
        },
        placeholders: {
          farmerCode: 'e.g., B001/11711',
          icNumber: 'e.g., 850101015678 or 850101-01-5678',
          fullName: 'e.g., Ahmad bin Abdullah',
          phone: 'e.g., 0123456789',
          address: 'Street address',
          postcode: 'e.g., 12345',
          city: 'e.g., Kuala Lumpur',
          selectState: 'Select state',
          bankName: 'e.g., Maybank',
          bankAccountNumber: 'e.g., 1234567890',
          bankName2: 'e.g., CIMB',
          bankAccountNumber2: 'e.g., 9876543210',
          farmSize: 'e.g., 5.5',
          notes: 'Additional notes about the farmer'
        },
        validations: {
          enterSubsidyNumber: 'Please enter subsidy number',
          subsidyPattern: 'Only uppercase letters, numbers, dashes, and forward slashes allowed',
          enterIc: 'Please enter IC number',
          ic12Digits: 'IC must be 12 digits',
          enterFullName: 'Please enter full name',
          invalidPhone: 'Invalid phone format',
          postcode5Digits: 'Postcode must be 5 digits',
          enterFarmSize: 'Please enter farm size',
          selectStatus: 'Please select status'
        },
        statusOptions: {
          active: 'Active',
          inactive: 'Inactive',
          suspended: 'Suspended'
        },
        messages: {
          updated: 'Farmer updated successfully!',
          added: 'Farmer added successfully!',
          updateFailed: 'Failed to update farmer',
          addFailed: 'Failed to add farmer',
          updateErrorPrefix: 'Error updating farmer: ',
          addErrorPrefix: 'Error adding farmer: '
        }
      },
      bulk: {
        title: 'Bulk Upload Farmers',
        templateDownloadedCsv: 'CSV template downloaded',
        templateDownloadedExcel: 'Excel template downloaded',
        fileMustContainRows: 'File must contain headers and at least one row of data',
        fileLoaded: 'File loaded: {count} rows found',
        errorReadingFile: 'Error reading file: {error}',
        mapAtLeastRequired: 'Please map at least the required fields',
        missingRequired: 'Missing required fields: {fields}',
        uploadStep: 'Upload File',
        mapStep: 'Map Columns',
        previewStep: 'Preview & Import',
        downloadTemplateFirst: 'Download Template First',
        downloadTemplateDesc: "Download the template, fill it with your data, then upload it back. The uploaded file can have different column names - you'll map them in the next step.",
        downloadTemplateHeading: '📋 Download Template',
        downloadExcelTemplate: 'Download Excel Template',
        downloadCsvTemplate: 'Download CSV Template',
        uploadYourFileHeading: '📤 Upload Your File',
        clickToUpload: 'Click to Upload CSV or Excel File',
        mapColumnsTitle: 'Map Your Columns',
        mapColumnsDesc: 'Match your file columns to the required fields. Red fields are required.',
        multiselectHint: 'Multi-select',
        selectColumnsConcat: 'Select one or more columns to concatenate',
        selectColumn: 'Select column from your file',
        columnNumber: 'Column {n}',
        back: 'Back',
        nextPreview: 'Next: Preview Data',
        previewTitle: 'Preview: Showing first {previewCount} of {totalCount} rows',
        previewDesc: 'Review the data before importing. Click Import to proceed.',
        importN: 'Import {count} Farmers',
        importedSuccess: 'Successfully imported {count} farmers',
        importFailedCount: '{count} farmers failed to import. Check console for details.',
        importFailed: 'Import failed: {error}'
      },
      qr: {
        title: 'Scan QR Code to Search Farmer',
        close: 'Close',
        cameraErrorTitle: 'Camera Error',
        positionQrTitle: 'Position the QR code in front of the camera',
        positionQrDesc: 'The QR code will be scanned automatically when detected',
        initializingCamera: 'Initializing camera...',
        cameraNotAvailable: 'Camera not available or access denied',
        checkPermissions: 'Please check camera permissions in your browser settings',
        cameraActiveHint: '📸 Camera active - Point at QR code on subsidy card'
      },
      subsidy: {
        title: 'Subsidy Card',
        saveFirstTitle: '⚠️ Save Farmer First',
        saveFirstDesc: "You must save the farmer information before you can upload a subsidy card. Click 'Add Farmer' or 'Update Farmer' button, then reopen this dialog to upload the card.",
        uploadingTitle: 'Uploading...',
        uploadingDesc: 'Please wait while the subsidy card is being uploaded. This may take a few moments for larger images.',
        alt: 'Subsidy Card',
        needSaveBeforeUpload: 'Please save the farmer first before uploading subsidy card',
        imageTooLarge: 'Image file is too large. Maximum size is 10MB.',
        uploadSuccess: 'Subsidy card uploaded successfully!',
        saveDocFailed: 'Failed to save document record: {error}',
        uploadFailed: 'Failed to upload image: {error}',
        processImageError: 'Error processing image: {error}',
        readFileFailed: 'Failed to read image file',
        uploadError: 'Error uploading subsidy card: {error}',
        noCardFound: 'No subsidy card found',
        qrUpdated: 'QR hashcode updated successfully!',
        updateFailed: 'Failed to update: {error}',
        updateError: 'Error updating hashcode: {error}',
        deleted: 'Subsidy card deleted successfully!',
        deleteFailed: 'Failed to delete: {error}',
        deleteError: 'Error deleting subsidy card: {error}',
        noImageToScan: 'No image to scan',
        qrDetected: 'QR code detected! {count} characters',
        qrNotDetected: 'No QR code detected. Ensure the image contains a clear, visible QR code.',
        failedToLoadImage: 'Failed to load image',
        detectError: 'Error detecting QR code: {error}',
        qrPlaceholderLong: 'Enter QR hashcode from subsidy card (200+ chars)',
        detectTitle: 'Automatically detect QR code from image',
        detect: 'Detect',
        updateQr: 'Update QR Hashcode',
        deleteCard: 'Delete Card',
        qrPlaceholderOptional: 'Enter QR hashcode (optional, can add later)',
        uploadImage: 'Upload Subsidy Card Image',
        uploadedAt: 'Uploaded: {date}',
        qrCodePrefix: 'QR Code:'
      }
    },
    manufacturers: {
      loadFailed: 'Failed to load manufacturers',
      loadError: 'Error loading manufacturers',
      searchFailed: 'Search failed',
      searchPlaceholder: 'Search manufacturers...',
      search: 'Search',
      addManufacturer: 'Add Manufacturer',
      paginationTotal: 'Total {total} manufacturers',
      columns: {
        companyName: 'Company Name',
        registrationNo: 'Registration No.',
        contactPerson: 'Contact Person',
        phone: 'Phone',
        email: 'Email',
        city: 'City',
        code: 'Code',
        status: 'Status',
        actions: 'Actions'
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        deleteComingSoon: 'Delete feature coming soon'
      },
      modal: {
        editTitle: 'Edit Manufacturer',
        addTitle: 'Add New Manufacturer',
        updateOk: 'Update Manufacturer',
        addOk: 'Add Manufacturer',
        cancel: 'Cancel',
        fields: {
          manufacturerCode: 'Manufacturer Code',
          registrationNumber: 'Registration Number',
          companyName: 'Company Name',
          contactPerson: 'Contact Person',
          phoneNumber: 'Phone Number',
          email: 'Email',
          address: 'Address',
          postcode: 'Postcode',
          city: 'City',
          state: 'State',
          creditLimitRm: 'Credit Limit (RM)',
          paymentTermsDays: 'Payment Terms (Days)',
          status: 'Status',
          contractStartDate: 'Contract Start Date',
          contractEndDate: 'Contract End Date',
          notes: 'Notes'
        },
        placeholders: {
          manufacturerCode: 'e.g., MFR-001',
          registrationNumber: 'e.g., ROC123456-A',
          companyName: 'e.g., Kilang Beras Sdn Bhd',
          contactPerson: 'e.g., Ahmad bin Abdullah',
          phone: 'e.g., 0123456789',
          email: 'e.g., contact@company.com',
          address: 'Street address',
          postcode: 'e.g., 12345',
          city: 'e.g., Kuala Lumpur',
          selectState: 'Select state',
          creditLimit: 'e.g., 50000',
          paymentTerms: 'e.g., 30',
          notes: 'Additional notes about the manufacturer'
        },
        validations: {
          enterManufacturerCode: 'Please enter manufacturer code',
          manufacturerCodePattern: 'Only uppercase letters, numbers, and dashes',
          enterRegistrationNumber: 'Please enter registration number',
          enterCompanyName: 'Please enter company name',
          invalidPhone: 'Invalid phone format',
          invalidEmail: 'Invalid email format',
          postcode5Digits: 'Postcode must be 5 digits',
          selectStatus: 'Please select status'
        },
        statusOptions: {
          active: 'Active',
          inactive: 'Inactive',
          suspended: 'Suspended'
        },
        messages: {
          updated: 'Manufacturer updated successfully!',
          added: 'Manufacturer added successfully!',
          updateFailed: 'Failed to update manufacturer',
          addFailed: 'Failed to add manufacturer',
          updateErrorPrefix: 'Error updating manufacturer: ',
          addErrorPrefix: 'Error adding manufacturer: '
        }
      }
    },
    reports: {
      title: 'Reports & Analytics',
      noActiveSeasonTitle: 'No Active Season',
      noActiveSeasonDesc: 'Please activate a season in Settings to view reports.',
      selectReportTitle: 'Select a Report',
      selectReportDesc: 'Choose a report type from the Reports menu.',
      purchases: {
        title: 'Purchase Report',
        downloadExcel: 'Download Excel',
        stats: {
          totalTransactions: 'Total Transactions',
          totalWeightPurchased: 'Total Weight Purchased',
          totalAmountPaid: 'Total Amount Paid'
        },
        columns: {
          date: 'Date',
          receiptNo: 'Receipt No',
          farmer: 'Farmer',
          product: 'Product',
          netWeightKg: 'Net Weight (kg)',
          pricePerKg: 'Price/kg',
          totalAmount: 'Total Amount',
          lorryNo: 'Lorry No',
          action: 'Action'
        },
        actions: {
          splits: 'Splits'
        },
        pagination: {
          totalTransactions: 'Total {total} transactions'
        },
        misc: {
          total: 'TOTAL',
          kg: 'kg',
          na: 'N/A'
        },
        messages: {
          loadFailed: 'Failed to load purchase data',
          downloaded: 'Report downloaded successfully',
          downloadFailed: 'Failed to download report',
          loadSplitsFailed: 'Failed to load split receipts'
        },
        split: {
          title: 'Split Receipt Details',
          close: 'Close',
          parentReceipt: 'Parent Receipt',
          originalWeight: 'Original Weight',
          originalAmount: 'Original Amount',
          summaryTotal: 'TOTAL ({count} splits)',
          columns: {
            receiptNo: 'Receipt No',
            date: 'Date',
            netWeightKg: 'Net Weight (kg)',
            amount: 'Amount',
            status: 'Status'
          }
        },
        status: {
          completed: 'COMPLETED',
          sold: 'SOLD',
          pending: 'PENDING'
        },
        excel: {
          columns: {
            receiptNo: 'Receipt No',
            date: 'Date',
            time: 'Time',
            farmerName: 'Farmer Name',
            product: 'Product',
            grossWeightKg: 'Gross Weight (kg)',
            tareWeightKg: 'Tare Weight (kg)',
            netWeightKg: 'Net Weight (kg)',
            pricePerKgRm: 'Price per kg (RM)',
            totalAmountRm: 'Total Amount (RM)',
            lorryNo: 'Lorry No',
            notes: 'Notes'
          },
          summary: {
            label: 'SUMMARY',
            totalTransactions: 'Total Transactions: {total}'
          },
          sheets: {
            purchaseReport: 'Purchase Report'
          }
        }
      },
      lorry: {
        title: 'Lorry Report',
        downloadExcel: 'Download Excel',
        stats: {
          totalLorries: 'Total Lorries',
          totalTrips: 'Total Trips',
          totalWeight: 'Total Weight',
          avgWeightPerTrip: 'Avg Weight/Trip'
        },
        columns: {
          lorryNumber: 'Lorry Number',
          frequencyTrips: 'Frequency (Trips)',
          cumulativeWeightKg: 'Cumulative Weight (kg)',
          totalAmountPaid: 'Total Amount Paid',
          avgWeightPerTrip: 'Avg Weight/Trip'
        },
        pagination: {
          totalLorries: 'Total {total} lorries'
        },
        tripDetailsTitle: 'Trip Details for {lorryNo}',
        tripColumns: {
          date: 'Date',
          farmer: 'Farmer',
          weightKg: 'Weight (kg)',
          amountRm: 'Amount (RM)'
        },
        misc: {
          total: 'TOTAL',
          kg: 'kg'
        },
        messages: {
          loadFailed: 'Failed to load purchase data',
          downloaded: 'Report downloaded successfully',
          downloadFailed: 'Failed to download report'
        },
        excel: {
          sheets: {
            lorrySummary: 'Lorry Summary'
          },
          summary: {
            overallLabel: 'OVERALL SUMMARY',
            columns: {
              lorryNumber: 'Lorry Number',
              frequencyTrips: 'Frequency (Trips)',
              cumulativeWeightKg: 'Cumulative Weight (kg)',
              totalAmountPaidRm: 'Total Amount Paid (RM)',
              avgWeightPerTripKg: 'Average Weight per Trip (kg)'
            }
          },
          details: {
            columns: {
              date: 'Date',
              farmer: 'Farmer',
              weightKg: 'Weight (kg)',
              amountRm: 'Amount (RM)'
            }
          }
        }
      },
      sales: {
        title: 'Sales Report',
        downloadExcel: 'Download Excel',
        stats: {
          totalTransactions: 'Total Transactions',
          totalWeightSold: 'Total Weight Sold',
          totalRevenue: 'Total Revenue'
        },
        tabs: {
          allSalesTransactions: 'All Sales Transactions',
          summaryByManufacturer: 'Summary by Manufacturer'
        },
        columns: {
          date: 'Date',
          transactionId: 'Transaction ID',
          manufacturer: 'Manufacturer',
          product: 'Product',
          netWeightKg: 'Net Weight (kg)',
          pricePerKg: 'Price/kg',
          totalAmount: 'Total Amount',
          lorryNo: 'Lorry No'
        },
        manufacturerSummary: {
          columns: {
            manufacturer: 'Manufacturer',
            transactions: 'Transactions',
            totalWeightKg: 'Total Weight (kg)',
            totalAmountRm: 'Total Amount (RM)',
            avgWeightPerTransaction: 'Avg Weight/Transaction'
          }
        },
        pagination: {
          totalTransactions: 'Total {total} transactions'
        },
        misc: {
          total: 'TOTAL',
          kg: 'kg',
          na: 'N/A',
          unknown: 'Unknown'
        },
        messages: {
          loadFailed: 'Failed to load sales data',
          downloaded: 'Report downloaded successfully',
          downloadFailed: 'Failed to download report'
        },
        excel: {
          columns: {
            transactionId: 'Transaction ID',
            date: 'Date',
            time: 'Time',
            manufacturer: 'Manufacturer',
            product: 'Product',
            grossWeightKg: 'Gross Weight (kg)',
            tareWeightKg: 'Tare Weight (kg)',
            netWeightKg: 'Net Weight (kg)',
            pricePerKgRm: 'Price per kg (RM)',
            totalAmountRm: 'Total Amount (RM)',
            lorryNo: 'Lorry No',
            notes: 'Notes'
          },
          summary: {
            label: 'SUMMARY',
            totalTransactions: 'Total Transactions: {total}'
          },
          sheets: {
            salesReport: 'Sales Report',
            byManufacturer: 'By Manufacturer'
          },
          manufacturerSummary: {
            columns: {
              manufacturer: 'Manufacturer',
              transactions: 'Transactions',
              totalWeightKg: 'Total Weight (kg)',
              totalAmountRm: 'Total Amount (RM)',
              avgWeightPerTransactionKg: 'Average Weight per Transaction (kg)'
            }
          }
        }
      }
    },
    purchasesWeighIn: {
      quickStats: {
        pendingLabel: 'Pending:',
        activeLabel: 'Active:',
        noneValue: 'None',
        autoSaveTag: '💾 Auto Save'
      },
      actions: {
        cancel: 'Cancel',
        saveWeighIn: 'Save Weigh-In',
        loadingSeasonTitle: 'Loading season...',
        pressF3ToStartTitle: 'Press F3 to start',
        newPurchaseWeighIn: 'New Purchase (Weigh-In)',
        pressF2ToOpenTitle: 'Press F2 to open',
        recallLorry: 'Recall Lorry ({count})'
      },
      recallModal: {
        title: 'Recall Lorry for Weigh-Out',
        alert: {
          message: 'Select Lorry to Complete Weighing',
          description: 'Click a lorry to complete the weigh-out process. Press F2 anytime to open this modal.'
        },
        lorryCard: {
          weighInLabel: 'Weigh-in:'
        }
      },
      farmerSearchModal: {
        title: 'Search Farmer - Multiple Methods',
        chooseMethodAlert: {
          message: 'Choose your search method',
          description: 'Choose your preferred QR scan method below, or use manual search'
        },
        qrScanMethodLabel: 'QR Code Scan Method',
        scanMethodOptions: {
          device: 'QR Scanner Device',
          camera: 'Camera Scan'
        },
        deviceScan: {
          placeholder: 'Focus here and scan with QR scanner device...',
          helperText: '📱 Hardware QR scanner will automatically input data here'
        },
        camera: {
          errorTitle: 'Camera Error',
          positionTitle: 'Position QR code in front of camera',
          positionDescription: 'QR code will be scanned automatically when detected',
          starting: 'Starting camera...',
          notAvailable: 'Camera not available or access denied',
          activeHint: '📸 Camera active - Point at QR code'
        },
        orDivider: 'OR',
        manualSearch: {
          title: 'Manual Search',
          placeholder: 'Search by name, subsidy no, or IC no...',
          minChars: 'Type at least 2 characters to search',
          noFarmersFound: 'No farmers found',
          tryDifferentTerms: 'Try different search terms'
        },
        results: {
          foundCount: 'Found {count} farmer(s)',
          columns: {
            subsidyNo: 'Subsidy No',
            name: 'Name',
            icNumber: 'IC No',
            phone: 'Phone',
            action: 'Action'
          },
          actions: {
            select: 'Select'
          }
        }
      },
      misc: {
        kg: 'kg'
      },
      weighOutWizard: {
        steps: {
          weight: 'Weight',
          farmer: 'Farmer',
          product: 'Product',
          deductions: 'Deductions',
          review: 'Review'
        },
        stageTitles: {
          enterTareWeight: 'Enter Tare Weight',
          selectFarmer: 'Select Farmer',
          selectPaddyProductType: 'Select Paddy Product Type',
          adjustDeductions: 'Adjust Deductions',
          reviewAndConfirmPurchase: 'Review & Confirm Purchase'
        },
        header: {
          weighingOutLabel: 'Weighing Out:',
          hintPress: 'Press',
          hintToGoBack: 'to go back',
          hintToNavigate: 'to navigate',
          currentStageLabel: 'Current Stage'
        },
        infoBar: {
          weighIn: 'Weigh-In',
          product: 'Product',
          farmer: 'Farmer',
          netWeight: 'Net Weight',
          totalAmount: 'Total Amount'
        },
        weightStage: {
          grossWeight: 'Gross Weight',
          tareWeight: 'Tare Weight',
          netWeight: 'Net Weight',
          tareWeightPlaceholder: '0.00'
        },
        actions: {
          cancelEsc: 'Cancel (ESC)',
          continue: 'Continue',
          backToWeight: 'Back to Weight',
          changeFarmer: 'Change Farmer',
          searchFarmer: 'Search Farmer',
          backToFarmer: 'Back to Farmer',
          backToProduct: 'Back to Product',
          continueToReview: 'Continue to Review',
          editDeductions: 'Edit Deductions',
          completePurchaseEnter: 'Complete Purchase (Enter)',
          changePresetTooltip: 'Change preset'
        },
        validations: {
          required: 'Required',
          zeroToHundredPercent: '0-100%'
        },
        placeholders: {
          zero: '0'
        },
        misc: {
          dash: '—',
          rm: 'RM',
          standard: 'Standard',
          deduction: 'Deduction',
          percent: '%'
        },
        messages: {
          noPriceSetForProductTitle: 'No price set for this product',
          noPriceSetForProductHint: 'Please set a price in Settings → Season & Prices',
          failedToLoadProductPricePrefix: 'Failed to load product price: ',
          switchedToPreset: 'Switched to "{preset}" preset',
          pleaseEnterValidTareWeight: 'Please enter valid tare weight',
          tareWeightCannotExceedGross: 'Tare weight cannot be greater than or equal to gross weight',
          failedToCompletePurchase: 'Failed to complete purchase'
        },
        review: {
          labels: {
            lorry: 'Lorry',
            product: 'Product',
            farmer: 'Farmer',
            grossWeight: 'Gross Weight',
            tareWeight: 'Tare Weight',
            netWeight: 'Net Weight',
            effectiveWeightAfterDeduction: 'Effective Weight (after deduction)',
            pricePerKg: 'Price per KG',
            totalAmount: 'Total Amount'
          }
        },
        presetModal: {
          title: 'Select Deduction Preset',
          description: 'Choose the appropriate deduction preset based on paddy quality:'
        }
      },
      messages: {
        saveToStorageFailed: 'Failed to save weight-in records to storage',
        loadingActiveSeason: 'Loading active season...',
        noActiveSeasonFound: 'No active season found. Please activate a season in Settings.',
        currentPriceNotSetForSeason: 'Current price not set for this season',
        noActiveSeasonActivateInSettings: 'No active season! Please activate a season in Settings.',
        weighInRecordedPrefix: '✅ Weigh-in recorded for',
        dataSavedSafeFromRefresh: '💾 Data saved - safe from page refresh',
        noPendingLorriesForSeason: 'No pending lorries to recall for this season',
        noPriceSetForProductInSeason: 'No price set for this product in current season',
        receiptCreatedButPrintingFailed: 'Receipt created but printing failed. You can reprint from transaction history.',
        failedToSavePurchasePrefix: 'Failed to save purchase: ',
        unknownError: 'Unknown error',
        failedToCompletePurchase: 'Failed to complete purchase',
        cameraNotSupported: 'Camera not supported on this device',
        cameraPermissionDenied: 'Camera permission denied',
        failedToOpenCameraPrefix: 'Failed to open camera: ',
        qrNotFoundInImage: 'No QR code found in the image',
        invalidQrPrefix: 'Invalid QR code: ',
        farmerNotFoundPrefix: 'Farmer not found: ',
        noSearchValue: 'Please enter search value',
        noFarmerSelected: 'Please select a farmer',
        noProductSelected: 'Please select a product',
        pleaseEnterValidPricePerKg: 'Please enter valid price per kg',
        noActiveWeighingSession: 'No active weighing session',
        noActiveSeasonFoundSimple: 'No active season found'
      }
    },
    salesWeighIn: {
      misc: {
        kg: 'kg'
      },
      quickStats: {
        pendingContainersTitle: 'Pending Containers (Waiting for Weigh-Out)',
        autoSaveTag: '💾 Auto-Save',
        recordsSafeHint: 'Records safe from page refresh',
        activeSessionTitle: 'Active Session',
        noneValue: 'None'
      },
      actions: {
        cancel: 'Cancel',
        saveTareWeight: 'Save Tare Weight',
        pressF3ToStartTitle: 'Press F3 to start',
        newSaleWeighInTare: 'New Sale (Weigh-In Tare)',
        pressF2ToOpenTitle: 'Press F2 to open',
        recallContainer: 'Recall Container ({count})'
      },
      weightInPanel: {
        titlePrefix: 'Weigh In (Tare):',
        description: 'Enter the EMPTY container weight (before loading)',
        fields: {
          tareWeightLabel: 'Tare Weight - Empty Container (KG)'
        },
        placeholders: {
          tareWeight: 'Enter empty container weight'
        },
        validations: {
          tareWeightRequired: 'Please enter tare weight'
        }
      },
      workflow: {
        title: 'Sales Workflow (Complete)',
        description: "1. Press F3 or click 'New Sale' → 2. Enter container number → 3. Enter TARE weight (empty) → 4. After loading, press F2 → 5. Enter GROSS weight (weigh-out) → 6. Click 'Select Receipts' to choose purchase receipts → 7. Split receipts if needed to match net weight → 8. Select manufacturer → 9. Complete!"
      },
      header: {
        weighingOutLabel: 'Weighing Out:',
        hintPress: 'Press',
        hintToGoBack: 'to go back',
        hintToNavigate: 'to navigate',
        currentStageLabel: 'Current Stage'
      },
      infoBar: {
        weighIn: 'Weigh-In',
        rm: 'RM'
      },
      actions: {
        refresh: 'Refresh',
        print: 'Print',
        export: 'Export',
        reprint: 'Reprint',
        reprintReceiptTooltip: 'Reprint Receipt'
      },
      table: {
        receipt: 'Receipt',
        dateTime: 'Date & Time',
        lorry: 'Lorry',
        farmer: 'Farmer',
        product: 'Product',
        grossKg: 'Gross (kg)',
        tareKg: 'Tare (kg)',
        netKg: 'Net (kg)',
        pricePerKg: 'Price/kg',
        totalAmount: 'Total Amount',
        status: 'Status',
        actions: 'Actions'
      },
      statuses: {
        paid: 'Paid',
        unpaid: 'Unpaid',
        pending: 'Pending',
        unknown: 'Unknown'
      },
      stats: {
        totalTransactions: 'Total Transactions',
        transactionsSuffix: 'transactions',
        totalWeight: 'Total Weight',
        kgSuffix: 'KG',
        totalAmount: 'Total Amount'
      },
      pagination: {
        totalTransactions: 'Total {total} transactions'
      },
      messages: {
        generatingReceipt: 'Generating receipt...',
        receiptSavedAsPdfPrefix: '📄 Receipt saved as PDF:',
        locationPrefix: 'Location:',
        receiptSentToPrinter: '✅ Receipt sent to printer',
        failedToPrintPrefix: 'Failed to print: ',
        failedToReprintReceipt: 'Failed to reprint receipt'
      }
    },
    purchasesPayment: {
      title: '💰 Payment Management',
      seasonLabel: 'Season {season_number}/{year}',
      misc: {
        dash: '—',
        rm: 'RM',
        kg: 'kg',
        percent: '%'
      },
      actions: {
        refresh: 'Refresh',
        pay: 'Pay',
        paid: 'Paid'
      },
      table: {
        receipt: 'Receipt',
        date: 'Date',
        farmer: 'Farmer',
        product: 'Product',
        netWeightKg: 'Net Weight (kg)',
        amount: 'Amount',
        paymentStatus: 'Payment Status',
        actions: 'Actions'
      },
      statuses: {
        paid: 'Paid',
        unpaid: 'Unpaid',
        unknown: 'Unknown'
      },
      stats: {
        totalTransactions: 'Total Transactions',
        transactionsSuffix: 'transactions',
        unpaid: 'Unpaid',
        unpaidAmount: 'Unpaid Amount',
        paidAmount: 'Paid Amount'
      },
      pagination: {
        totalTransactions: 'Total {total} transactions'
      },
      validations: {
        required: 'Required',
        zeroToHundredPercent: '0-100%'
      },
      presets: {
        standard: 'Standard'
      },
      modal: {
        title: 'Record Payment',
        confirmPayment: 'Confirm Payment',
        tipTitle: '💡 Tip:',
        tipBody: 'Adjust deductions below. Amount recalculates automatically.',
        info: {
          receipt: 'Receipt',
          farmer: 'Farmer',
          netWeight: 'Net Weight',
          pricePerTon: 'Price/ton'
        },
        deductions: {
          title: 'Deductions:',
          selectPreset: 'Select Preset',
          typeLabel: 'Type',
          typePlaceholder: 'e.g., Moisture',
          rateLabel: 'Rate (%)',
          ratePlaceholder: '0.00',
          addDeduction: 'Add Deduction'
        },
        summary: {
          title: '💰 Payment Summary',
          netWeight: 'Net Weight:',
          deduction: 'Deduction:',
          effectiveWeight: 'Effective Weight:',
          totalAmount: 'Total Amount:'
        }
      },
      presetModal: {
        title: 'Select Deduction Preset',
        apply: 'Apply',
        cancel: 'Cancel',
        noPresets: 'No deduction presets configured for the active season.',
        presetN: 'Preset {n}'
      },
      messages: {
        processingPayment: 'Processing payment...',
        paymentRecordedSuccessfully: 'Payment recorded successfully',
        receiptRegeneratedPrefix: '📄 Receipt regenerated:',
        locationPrefix: 'Location:',
        receiptPrintedSuccessfully: 'Receipt printed successfully',
        paymentRecordedButReceiptPrintingFailed: 'Payment recorded but receipt printing failed',
        failedToRecordPayment: 'Failed to record payment'
      }
    },
    settings: {
      company: {
        tab: 'Company',
        cardTitle: 'Company Details',
        fields: {
          companyName: 'Company Name',
          companyAddress: 'Company Address',
          companyRegistrationNo: 'Company Registration No',
          paddyPurchasingLicenceNo: 'Paddy Purchasing Licence No'
        },
        placeholders: {
          companyName: 'e.g., ABC Rice Mill Sdn Bhd',
          companyAddress: 'e.g., No. 1, Jalan Example, 12345',
          companyRegistrationNo: 'e.g., 201901234567',
          paddyPurchasingLicenceNo: 'e.g., PP-1234'
        },
        validations: {
          companyNameRequired: 'Please enter company name',
          companyAddressRequired: 'Please enter company address',
          companyRegistrationNoRequired: 'Please enter company registration no',
          paddyPurchasingLicenceNoRequired: 'Please enter paddy purchasing licence no'
        },
        extras: {
          companyName: 'This will appear on receipts',
          companyAddress: 'This will appear on receipts',
          companyRegistrationNo: 'This will appear on receipts',
          paddyPurchasingLicenceNo: 'This will appear on receipts'
        },
        actions: {
          save: 'Save',
          reset: 'Reset'
        }
      },
      general: {
        tab: 'General',
        sections: {
          application: 'Application',
          printer: 'Printer'
        },
        fields: {
          applicationName: 'Application Name',
          language: 'Language',
          currency: 'Currency',
          dateFormat: 'Date Format',
          defaultPrinter: 'Default Printer',
          autoPrintAfterTransaction: 'Auto print after transaction',
          numberOfCopies: 'Number of copies'
        },
        placeholders: {
          applicationName: 'Enter application name',
          selectPrinter: 'Select printer'
        },
        extras: {
          defaultPrinter: 'Used for receipt printing'
        },
        actions: {
          save: 'Save',
          reset: 'Reset',
          refreshPrinters: 'Refresh Printers'
        },
        languageOptions: {
          en: 'English',
          ms: 'Malay'
        },
        currencyOptions: {
          myr: 'MYR (RM)',
          usd: 'USD ($)'
        },
        dateFormatOptions: {
          yyyyMmDd: 'YYYY-MM-DD',
          ddMmYyyy: 'DD/MM/YYYY',
          mmDdYyyy: 'MM/DD/YYYY'
        },
        printerDropdown: {
          loading: 'Loading printers...',
          noPrintersFound: 'No printers found',
          defaultSuffix: '(Default)'
        }
      },
      database: {
        tab: 'Database',
        sections: {
          connection: 'Connection',
          connectionPool: 'Connection Pool'
        },
        fields: {
          host: 'Host',
          port: 'Port',
          name: 'Database Name',
          connectionLimit: 'Connection Limit'
        },
        placeholders: {
          host: 'e.g., localhost',
          name: 'e.g., padi'
        },
        extras: {
          connectionLimit: 'Maximum number of concurrent connections'
        },
        actions: {
          save: 'Save',
          testConnection: 'Test Connection'
        },
        messages: {
          connectionSuccess: 'Connection successful',
          connectionFailed: 'Connection failed',
          connectionTestFailed: 'Connection test failed'
        }
      },
      hardware: {
        tab: 'Hardware',
        sections: {
          weighbridge: 'Weighbridge'
        },
        fields: {
          serialPort: 'Serial Port',
          baudRate: 'Baud Rate',
          autoConnect: 'Auto connect'
        },
        placeholders: {
          serialPort: 'e.g., /dev/ttyUSB0'
        },
        extras: {
          serialPort: 'Serial port for the weighbridge device'
        },
        actions: {
          save: 'Save',
          testWeighbridge: 'Test Weighbridge'
        },
        messages: {
          weighbridgeConnected: 'Weighbridge connected',
          weighbridgeNotImplemented: 'Weighbridge integration not implemented',
          weighbridgeTestNotAvailable: 'Weighbridge test not available'
        }
      },
      printer: {
        tab: 'Printer',
        sections: {
          receiptPrinting: 'Receipt Printing',
          pdfOptions: 'PDF Options',
          receiptTemplate: 'Receipt Template'
        },
        fields: {
          defaultPrinter: 'Default Printer',
          numberOfCopies: 'Number of copies',
          paperSize: 'Paper Size',
          autoPrintAfterTransaction: 'Auto print after transaction',
          saveReceiptsAsPdf: 'Save receipts as PDF',
          pdfSaveLocation: 'PDF save location',
          autoOpenPdfAfterSave: 'Auto open PDF after save',
          receiptHeader: 'Receipt Header',
          receiptFooter: 'Receipt Footer'
        },
        placeholders: {
          defaultPrinter: 'e.g., EPSON TM-T82',
          pdfSaveLocation: 'Select a folder',
          receiptHeader: 'Enter receipt header',
          receiptFooter: 'Enter receipt footer'
        },
        extras: {
          paperSize: 'Choose the correct paper size for your printer',
          saveReceiptsAsPdf: 'Enable to save receipts as PDF after printing',
          pdfSaveLocation: 'Folder where PDF receipts will be saved',
          autoOpenPdfAfterSave: 'Automatically open PDF after saving'
        },
        actions: {
          browse: 'Browse',
          save: 'Save'
        },
        validations: {
          pdfSaveLocationRequired: 'Please select a PDF save location'
        },
        messages: {
          failedToSelectFolder: 'Failed to select folder'
        },
        paperSizeOptions: {
          thermal80mm: 'Thermal 80mm',
          a4Portrait: 'A4 Portrait',
          a5Landscape: 'A5 Landscape'
        }
      },
      backup: {
        tab: 'Backup',
        sections: {
          automaticBackup: 'Automatic Backup'
        },
        fields: {
          enableAutoBackup: 'Enable auto backup',
          backupFrequency: 'Backup frequency',
          retentionPeriodDays: 'Retention period (days)',
          backupDirectory: 'Backup directory'
        },
        placeholders: {
          backupDirectory: 'Select a folder'
        },
        extras: {
          retentionPeriodDays: 'How long to keep backup files',
          backupDirectory: 'Folder where backups will be saved'
        },
        actions: {
          browse: 'Browse',
          save: 'Save',
          backupNow: 'Backup Now'
        },
        frequencyOptions: {
          hourly: 'Hourly',
          daily: 'Daily',
          weekly: 'Weekly',
          monthly: 'Monthly'
        },
        messages: {
          failedToSelectFolder: 'Failed to select folder',
          backupNowComingSoon: 'Backup now feature coming soon'
        }
      },
      systemInfo: {
        tab: 'System Info',
        cardTitle: 'System Information',
        fields: {
          applicationVersion: 'Application Version',
          electronVersion: 'Electron Version',
          nodeVersion: 'Node Version',
          platform: 'Platform',
          databaseStatus: 'Database Status',
          databaseVersion: 'Database Version',
          databaseName: 'Database Name'
        },
        fallbacks: {
          appVersion: 'N/A',
          electronVersion: 'N/A',
          nodeVersion: 'N/A',
          platform: 'N/A',
          databaseStatus: 'N/A',
          databaseVersion: 'N/A',
          databaseName: 'N/A'
        },
        actions: {
          refresh: 'Refresh',
          exportLogs: 'Export Logs'
        },
        messages: {
          exportLogsComingSoon: 'Export logs feature coming soon'
        }
      }
    },
    home: {
      title: 'Home',
      description: 'Quick guidance before you start operations.',
      currentSeason: {
        title: 'Current Season',
        manageButton: 'Manage Seasons',
        noActiveSeason: 'No active season',
        noActiveSeasonDesc: 'Please activate a season before doing transactions.',
        goToSeasons: 'Go to Seasons',
        fields: {
          season: 'Season',
          yearSeasonNum: 'Year / Season #',
          period: 'Period',
          openingPrice: 'Opening Price (per ton)',
          targetQuantity: 'Target Quantity (kg)'
        },
        stats: {
          openingPrice: 'Opening Price',
          perTon: '/ ton',
          target: 'Target',
          kg: 'kg'
        }
      },
      sections: {
        beforeYouStart: 'Before you start',
        menuIntroduction: 'Menu introduction'
      },
      cards: {
        showMore: 'Show More',
        mainConfig: {
          title: 'Main Configuration',
          description: 'Make sure your system is ready:',
          tags: {
            company: 'Company',
            hardware: 'Hardware',
            printer: 'Printer',
            language: 'Language'
          },
          hint: 'Start here: Settings'
        },
        seasonPrices: {
          title: 'Season & Prices',
          description: 'Transactions require an active season and product pricing.',
          goToSeasons: 'Go to Seasons',
          hint: 'Menu: Settings → Seasons'
        },
        masterData: {
          title: 'Master Data Ready',
          description: 'Confirm your reference lists are complete before operations.',
          tags: {
            farmers: 'Farmers',
            manufacturers: 'Manufacturers',
            products: 'Products'
          }
        },
        purchases: {
          title: 'Purchases',
          description: 'Weigh-in, weigh-out, payment and purchase history.',
          hint: 'Menu: Transactions → Purchases'
        },
        sales: {
          title: 'Sales',
          description: 'Sell to manufacturers via container tare weigh-in and weigh-out completion.',
          hint: 'Menu: Transactions → Sales'
        },
        reports: {
          title: 'Reports',
          description: 'View summaries and export reports for purchases, sales and lorry movements.',
          hint: 'Menu: Reports'
        }
      }
    },
    menu: {
      home: 'Home',
      dashboard: 'Dashboard',
      farmers: 'Farmers',
      manufacturers: 'Manufacturers',
      reports: 'Reports',
      purchaseReport: 'Purchase Report',
      salesReport: 'Sales Report',
      lorryReport: 'Lorry Report',
      settings: 'Settings',
      general: 'General',
      seasonConfig: 'Seasons',
      productConfig: 'Products',
      backupRestore: 'Backup / Restore',
      purchases: 'Purchases',
      weighIn: 'Weigh-In',
      history: 'History',
      payment: 'Payment',
      sales: 'Sales',
      stockpiles: 'Stockpiles'
    }
  },
  ms: {
    purchasesHistory: {
      title: 'Sejarah Transaksi Belian',
      seasonLabel: 'Musim {season_number}/{year}',
      misc: {
        dash: '-',
        rm: 'RM'
      },
      actions: {
        refresh: 'Muat Semula',
        print: 'Cetak',
        export: 'Eksport',
        reprint: 'Cetak Semula',
        reprintReceiptTooltip: 'Cetak Semula Resit'
      },
      table: {
        receipt: 'Resit',
        dateTime: 'Tarikh & Masa',
        lorry: 'Lori',
        farmer: 'Pesawah',
        product: 'Produk',
        grossKg: 'Kasar (kg)',
        tareKg: 'Tare (kg)',
        netKg: 'Bersih (kg)',
        pricePerKg: 'Harga/kg',
        totalAmount: 'Jumlah',
        status: 'Status',
        actions: 'Tindakan'
      },
      statuses: {
        paid: 'Dibayar',
        unpaid: 'Belum Dibayar',
        pending: 'Menunggu',
        unknown: 'Tidak Diketahui'
      },
      stats: {
        totalTransactions: 'Jumlah Transaksi',
        transactionsSuffix: 'transaksi',
        totalWeight: 'Jumlah Berat',
        kgSuffix: 'KG',
        totalAmount: 'Jumlah'
      },
      pagination: {
        totalTransactions: 'Jumlah {total} transaksi'
      },
      messages: {
        generatingReceipt: 'Menjana resit...',
        receiptSavedAsPdfPrefix: '📄 Resit disimpan sebagai PDF:',
        locationPrefix: 'Lokasi:',
        receiptSentToPrinter: '✅ Resit dihantar ke pencetak',
        failedToPrintPrefix: 'Gagal mencetak: ',
        failedToReprintReceipt: 'Gagal cetak semula resit'
      }
    },
    purchasesPayment: {
      title: '💰 Pengurusan Bayaran',
      seasonLabel: 'Musim {season_number}/{year}',
      misc: {
        dash: '-',
        rm: 'RM',
        kg: 'kg',
        percent: '%'
      },
      actions: {
        refresh: 'Muat Semula',
        pay: 'Bayar',
        paid: 'Dibayar'
      },
      table: {
        receipt: 'Resit',
        date: 'Tarikh',
        farmer: 'Pesawah',
        product: 'Produk',
        netWeightKg: 'Berat Bersih (kg)',
        amount: 'Jumlah',
        paymentStatus: 'Status Bayaran',
        actions: 'Tindakan'
      },
      statuses: {
        paid: 'Dibayar',
        unpaid: 'Belum Dibayar',
        unknown: 'Tidak Diketahui'
      },
      stats: {
        totalTransactions: 'Jumlah Transaksi',
        transactionsSuffix: 'transaksi',
        unpaid: 'Belum Dibayar',
        unpaidAmount: 'Jumlah Belum Dibayar',
        paidAmount: 'Jumlah Dibayar'
      },
      pagination: {
        totalTransactions: 'Jumlah {total} transaksi'
      },
      validations: {
        required: 'Wajib',
        zeroToHundredPercent: '0-100%'
      },
      presets: {
        standard: 'Standard'
      },
      modal: {
        title: 'Rekod Bayaran',
        confirmPayment: 'Sahkan Bayaran',
        tipTitle: '💡 Tip:',
        tipBody: 'Laraskan potongan di bawah. Jumlah akan dikira semula secara automatik.',
        info: {
          receipt: 'Resit',
          farmer: 'Pesawah',
          netWeight: 'Berat Bersih',
          pricePerTon: 'Harga/ton'
        },
        deductions: {
          title: 'Potongan:',
          selectPreset: 'Pilih Preset',
          typeLabel: 'Jenis',
          typePlaceholder: 'cth., Kelembapan',
          rateLabel: 'Kadar (%)',
          ratePlaceholder: '0.00',
          addDeduction: 'Tambah Potongan'
        },
        summary: {
          title: '💰 Ringkasan Bayaran',
          netWeight: 'Berat Bersih:',
          deduction: 'Potongan:',
          effectiveWeight: 'Berat Efektif:',
          totalAmount: 'Jumlah:'
        }
      },
      presetModal: {
        title: 'Pilih Preset Potongan',
        apply: 'Guna',
        cancel: 'Batal',
        noPresets: 'Tiada preset potongan dikonfigurasi untuk musim aktif.',
        presetN: 'Preset {n}'
      },
      messages: {
        processingPayment: 'Memproses bayaran...',
        paymentRecordedSuccessfully: 'Bayaran berjaya direkodkan',
        receiptRegeneratedPrefix: '📄 Resit dijana semula:',
        locationPrefix: 'Lokasi:',
        receiptPrintedSuccessfully: 'Resit berjaya dicetak',
        paymentRecordedButReceiptPrintingFailed: 'Bayaran direkodkan tetapi cetakan resit gagal',
        failedToRecordPayment: 'Gagal merekodkan bayaran'
      }
    },
    purchasesWeighIn: {
      quickStats: {
        pendingLabel: 'Menunggu:',
        activeLabel: 'Aktif:',
        noneValue: 'Tiada',
        autoSaveTag: '💾 Simpan Automatik'
      },
      messages: {
        pleaseEnterValidPricePerKg: 'Sila masukkan harga per kg yang sah',
        noActiveWeighingSession: 'Tiada sesi timbangan aktif',
        noActiveSeasonFoundSimple: 'Tiada musim aktif dijumpai',
        failedToSavePurchasePrefix: 'Gagal menyimpan belian: ',
        unknownError: 'Ralat tidak diketahui'
      },
      weighOutWizard: {
        steps: {
          weight: 'Berat',
          farmer: 'Pesawah',
          product: 'Produk',
          deductions: 'Potongan',
          review: 'Semak'
        },
        stageTitles: {
          enterTareWeight: 'Masukkan Berat Tare',
          selectFarmer: 'Pilih Pesawah',
          selectPaddyProductType: 'Pilih Jenis Produk Padi',
          adjustDeductions: 'Laraskan Potongan',
          reviewAndConfirmPurchase: 'Semak & Sahkan Belian'
        },
        header: {
          weighingOutLabel: 'Timbang Keluar:',
          hintPress: 'Tekan',
          hintToGoBack: 'untuk kembali',
          hintToNavigate: 'untuk navigasi',
          currentStageLabel: 'Peringkat Semasa'
        },
        weightStage: {
          grossWeight: 'Berat Kasar',
          tareWeight: 'Berat Tare',
          netWeight: 'Berat Bersih',
          tareWeightPlaceholder: '0.00'
        }
      },
      weighInPanel: {
        titlePrefix: 'Timbang Masuk:',
        description: 'Masukkan berat dengan muatan',
        fields: {
          weightWithLoadLabel: 'Berat dengan Muatan (KG)'
        },
        placeholders: {
          weightWithLoad: 'Masukkan berat dengan muatan'
        },
        validations: {
          weightRequired: 'Sila masukkan berat'
        }
      },
      actions: {
        cancel: 'Batal',
        saveWeighIn: 'Simpan Timbang Masuk',
        loadingSeasonTitle: 'Memuat musim...',
        pressF3ToStartTitle: 'Tekan F3 untuk mula',
        newPurchaseWeighIn: 'Belian Baharu (Timbang Masuk)',
        pressF2ToOpenTitle: 'Tekan F2 untuk buka',
        recallLorry: 'Panggil Lori ({count})'
      },
      status: {
        loadingSeason: 'Memuat musim...',
        noActiveSeason: '⚠️ Tiada musim aktif'
      },
      lorryModal: {
        title: 'Belian Baharu - Masukkan Lori',
        fields: {
          lorryRegistrationNumber: 'Nombor Pendaftaran Lori'
        },
        placeholders: {
          lorryRegistrationExample: 'cth., ABC 1234'
        },
        validations: {
          lorryRegistrationRequired: 'Sila masukkan pendaftaran lori'
        },
        actions: {
          okNextWeighIn: 'OK - Seterusnya: Timbang Masuk'
        }
      },
      recallModal: {
        title: 'Panggil Lori untuk Timbang Keluar',
        alert: {
          message: 'Pilih Lori untuk Lengkapkan Timbangan',
          description: 'Klik pada lori untuk lengkapkan proses timbang keluar. Tekan F2 bila-bila masa untuk buka modal ini.'
        },
        lorryCard: {
          weighInLabel: 'Timbang masuk:'
        }
      },
      farmerSearchModal: {
        title: 'Cari Pesawah - Pelbagai Kaedah',
        chooseMethodAlert: {
          message: 'Pilih kaedah carian anda',
          description: 'Pilih kaedah imbas QR yang anda suka di bawah, atau gunakan carian manual'
        },
        qrScanMethodLabel: 'Kaedah Imbas Kod QR',
        scanMethodOptions: {
          device: 'Peranti Pengimbas QR',
          camera: 'Imbas Kamera'
        },
        deviceScan: {
          placeholder: 'Fokus di sini dan imbas dengan peranti pengimbas QR...',
          helperText: '📱 Pengimbas QR perkakasan akan memasukkan data di sini secara automatik'
        },
        camera: {
          errorTitle: 'Ralat Kamera',
          positionTitle: 'Letakkan kod QR di hadapan kamera',
          positionDescription: 'Kod QR akan diimbas secara automatik apabila dikesan',
          starting: 'Memulakan kamera...',
          notAvailable: 'Kamera tidak tersedia atau akses ditolak',
          activeHint: '📸 Kamera aktif - Halakan pada kod QR'
        },
        orDivider: 'ATAU',
        manualSearch: {
          title: 'Carian Manual',
          placeholder: 'Cari mengikut nama, no. subsidi, atau no. IC...',
          minChars: 'Taip sekurang-kurangnya 2 aksara untuk cari',
          noFarmersFound: 'Tiada pesawah dijumpai',
          tryDifferentTerms: 'Cuba istilah carian yang berbeza'
        },
        results: {
          foundCount: 'Dijumpai {count} pesawah',
          columns: {
            subsidyNo: 'No. Subsidi',
            name: 'Nama',
            icNumber: 'No. IC',
            phone: 'Telefon',
            action: 'Tindakan'
          },
          actions: {
            select: 'Pilih'
          }
        }
      }
    },
    salesWeighIn: {
      misc: {
        kg: 'kg'
      },
      quickStats: {
        pendingContainersTitle: 'Kontena Menunggu (Menunggu Timbang Keluar)',
        autoSaveTag: '💾 Simpan Automatik',
        recordsSafeHint: 'Rekod selamat daripada muat semula',
        activeSessionTitle: 'Sesi Aktif',
        noneValue: 'Tiada'
      },
      actions: {
        cancel: 'Batal',
        saveTareWeight: 'Simpan Berat Tare',
        pressF3ToStartTitle: 'Tekan F3 untuk mula',
        newSaleWeighInTare: 'Jualan Baharu (Timbang Masuk Tare)',
        pressF2ToOpenTitle: 'Tekan F2 untuk buka',
        recallContainer: 'Panggil Kontena ({count})'
      },
      weightInPanel: {
        titlePrefix: 'Timbang Masuk (Tare):',
        description: 'Masukkan berat kontena KOSONG (sebelum dimuat)',
        fields: {
          tareWeightLabel: 'Berat Tare - Kontena Kosong (KG)'
        },
        placeholders: {
          tareWeight: 'Masukkan berat kontena kosong'
        },
        validations: {
          tareWeightRequired: 'Sila masukkan berat tare'
        }
      },
      workflow: {
        title: 'Aliran Kerja Jualan (Lengkap)',
        description: "1. Tekan F3 atau klik 'Jualan Baharu' → 2. Masukkan no. kontena → 3. Masukkan berat TARE (kosong) → 4. Selepas dimuat, tekan F2 → 5. Masukkan berat GROSS (timbang keluar) → 6. Klik 'Pilih Resit' untuk pilih resit belian → 7. Bahagi resit jika perlu untuk padankan berat bersih → 8. Pilih pengilang → 9. Selesai!"
      },
      containerModal: {
        title: 'Jualan Baharu - Masukkan Kontena/Lori',
        fields: {
          vehicleRegistrationNumber: 'Nombor Pendaftaran Kontena/Lori'
        },
        placeholders: {
          vehicleRegistrationExample: 'cth., ABC 1234'
        },
        validations: {
          vehicleRegistrationRequired: 'Sila masukkan pendaftaran kenderaan'
        },
        actions: {
          okNextWeighInTare: 'OK - Seterusnya: Timbang Masuk (Tare)'
        }
      },
      recallModal: {
        title: 'Panggil Kontena untuk Timbang Keluar',
        alert: {
          message: 'Pilih Kontena untuk Lengkapkan Timbangan',
          description: 'Klik pada kontena untuk lengkapkan proses timbang keluar (selepas dimuat). Tekan F2 bila-bila masa untuk buka modal ini.'
        },
        containerCard: {
          tareLabel: 'Tare:'
        }
      },
      receiptsTable: {
        receipt: 'Resit',
        date: 'Tarikh',
        farmer: 'Pesawah',
        netWeightKg: 'Berat Bersih (kg)'
      },
      messages: {
        saveToStorageFailed: 'Gagal menyimpan rekod timbang masuk ke storan',
        noActiveSeasonFound: 'Tiada musim aktif dijumpai. Sila aktifkan musim di Tetapan.',
        selectedPrefix: 'Dipilih:',
        noActiveSeasonActivateInSettings: 'Tiada musim aktif! Sila aktifkan musim di Tetapan.',
        weighInRecordedPrefix: '✅ Timbang masuk (tare) direkodkan untuk',
        dataSavedSafeFromRefresh: '💾 Kontena sedia untuk dimuat - data disimpan',
        noPendingContainersForSeason: 'Tiada kontena menunggu untuk musim ini',
        loadingAvailableReceipts: 'Memuat resit tersedia...',
        noActiveSeasonFoundSimple: 'Tiada musim aktif dijumpai',
        failedToLoadAvailableReceiptsPrefix: 'Gagal memuat resit tersedia: ',
        failedToLoadAvailableReceipts: 'Gagal memuat resit tersedia',
        pleaseEnterGrossWeightFirst: 'Sila masukkan berat gross dahulu',
        noActiveSession: 'Tiada sesi aktif',
        containerFullCannotAddMoreReceipts: 'Kontena penuh ({weight} kg). Tidak boleh tambah resit lagi.',
        autoSplitPrefix: '🔪 Auto-bahagi:',
        autoSplitToBuyerLabel: '→ Kepada pembeli:',
        autoSplitRemainingLabel: '→ Baki:',
        autoSplitRemainingSuffix: '(kekal tersedia)',
        pleaseSelectAtLeastOneReceipt: 'Sila pilih sekurang-kurangnya satu resit',
        perfectMatchSelectedReceipts: '✅ Padanan sempurna! Dipilih {count} resit berjumlah {weight} kg',
        selectedReceiptsTotaling: 'Dipilih {count} resit berjumlah {weight} kg',
        receiptRemovedFromSelection: 'Resit dibuang daripada pilihan',
        splitWeightInvalid: 'Berat bahagian mesti lebih daripada 0 dan kurang daripada berat asal',
        receiptSplitKeepingInSalePrefix: 'Resit dibahagi! Simpan',
        receiptSplitKeepingInSaleMiddle: 'dalam jualan, buang',
        receiptSplitRemovedExcessSuffix: 'lebihan',
        receiptSplitAddedToSalePrefix: 'Resit dibahagi! Tambah',
        receiptSplitAddedToSaleMiddle: 'ke dalam jualan,',
        receiptSplitStaysInOriginalSuffix: 'kekal dalam resit asal',
        invalidSessionOrSeason: 'Sesi atau musim tidak sah',
        saleCompletedReceiptPrefix: '✅ Jualan selesai! Resit:',
        weightInRecordRemovedFromStorage: '🗑️ Rekod timbang masuk dibuang daripada storan',
        salesReceiptSavedAsPdfPrefix: '📄 Resit jualan disimpan sebagai PDF:',
        locationPrefix: 'Lokasi:',
        saleCompletedButPrintingFailed: 'Jualan selesai tetapi cetakan gagal. Anda boleh cetak semula dari sejarah.',
        failedToSaveSalePrefix: 'Gagal menyimpan jualan: ',
        failedToCompleteSale: 'Gagal menyelesaikan jualan',
        unknownError: 'Ralat tidak diketahui'
      }
    },
    settings: {
      company: {
        tab: 'Syarikat',
        cardTitle: 'Maklumat Syarikat',
        fields: {
          companyName: 'Nama Syarikat',
          companyAddress: 'Alamat Syarikat',
          companyRegistrationNo: 'No. Pendaftaran Syarikat',
          paddyPurchasingLicenceNo: 'No. Lesen Belian Padi'
        },
        placeholders: {
          companyName: 'cth., ABC Rice Mill Sdn Bhd',
          companyAddress: 'cth., No. 1, Jalan Contoh, 12345',
          companyRegistrationNo: 'cth., 201901234567',
          paddyPurchasingLicenceNo: 'cth., PP-1234'
        },
        validations: {
          companyNameRequired: 'Sila masukkan nama syarikat',
          companyAddressRequired: 'Sila masukkan alamat syarikat',
          companyRegistrationNoRequired: 'Sila masukkan no. pendaftaran syarikat',
          paddyPurchasingLicenceNoRequired: 'Sila masukkan no. lesen belian padi'
        },
        extras: {
          companyName: 'Akan dipaparkan pada resit',
          companyAddress: 'Akan dipaparkan pada resit',
          companyRegistrationNo: 'Akan dipaparkan pada resit',
          paddyPurchasingLicenceNo: 'Akan dipaparkan pada resit'
        },
        actions: {
          save: 'Simpan',
          reset: 'Tetap Semula'
        }
      },
      general: {
        tab: 'Umum',
        sections: {
          application: 'Aplikasi',
          printer: 'Pencetak'
        },
        fields: {
          applicationName: 'Nama Aplikasi',
          language: 'Bahasa',
          currency: 'Mata Wang',
          dateFormat: 'Format Tarikh',
          defaultPrinter: 'Pencetak Lalai',
          autoPrintAfterTransaction: 'Cetak automatik selepas transaksi',
          numberOfCopies: 'Bilangan salinan'
        },
        placeholders: {
          applicationName: 'Masukkan nama aplikasi',
          selectPrinter: 'Pilih pencetak'
        },
        extras: {
          defaultPrinter: 'Digunakan untuk cetakan resit'
        },
        actions: {
          save: 'Simpan',
          reset: 'Tetap Semula',
          refreshPrinters: 'Muat Semula Pencetak'
        },
        languageOptions: {
          en: 'Inggeris',
          ms: 'Melayu'
        },
        currencyOptions: {
          myr: 'MYR (RM)',
          usd: 'USD ($)'
        },
        dateFormatOptions: {
          yyyyMmDd: 'YYYY-MM-DD',
          ddMmYyyy: 'DD/MM/YYYY',
          mmDdYyyy: 'MM/DD/YYYY'
        },
        printerDropdown: {
          loading: 'Memuat pencetak...',
          noPrintersFound: 'Tiada pencetak dijumpai',
          defaultSuffix: '(Lalai)'
        }
      },
      database: {
        tab: 'Pangkalan Data',
        sections: {
          connection: 'Sambungan',
          connectionPool: 'Kolam Sambungan'
        },
        fields: {
          host: 'Hos',
          port: 'Port',
          name: 'Nama Pangkalan Data',
          connectionLimit: 'Had Sambungan'
        },
        placeholders: {
          host: 'cth., localhost',
          name: 'cth., padi'
        },
        extras: {
          connectionLimit: 'Bilangan maksimum sambungan serentak'
        },
        actions: {
          save: 'Simpan',
          testConnection: 'Uji Sambungan'
        },
        messages: {
          connectionSuccess: 'Sambungan berjaya',
          connectionFailed: 'Sambungan gagal',
          connectionTestFailed: 'Ujian sambungan gagal'
        }
      },
      hardware: {
        tab: 'Perkakasan',
        sections: {
          weighbridge: 'Jambatan Timbang'
        },
        fields: {
          serialPort: 'Port Serial',
          baudRate: 'Kadar Baud',
          autoConnect: 'Sambung automatik'
        },
        placeholders: {
          serialPort: 'cth., /dev/ttyUSB0'
        },
        extras: {
          serialPort: 'Port serial untuk peranti jambatan timbang'
        },
        actions: {
          save: 'Simpan',
          testWeighbridge: 'Uji Jambatan Timbang'
        },
        messages: {
          weighbridgeConnected: 'Jambatan timbang disambungkan',
          weighbridgeNotImplemented: 'Integrasi jambatan timbang belum disediakan',
          weighbridgeTestNotAvailable: 'Ujian jambatan timbang tidak tersedia'
        }
      },
      printer: {
        tab: 'Pencetak',
        sections: {
          receiptPrinting: 'Cetakan Resit',
          pdfOptions: 'Pilihan PDF',
          receiptTemplate: 'Templat Resit'
        },
        fields: {
          defaultPrinter: 'Pencetak Lalai',
          numberOfCopies: 'Bilangan salinan',
          paperSize: 'Saiz Kertas',
          autoPrintAfterTransaction: 'Cetak automatik selepas transaksi',
          saveReceiptsAsPdf: 'Simpan resit sebagai PDF',
          pdfSaveLocation: 'Lokasi simpanan PDF',
          autoOpenPdfAfterSave: 'Buka PDF automatik selepas simpan',
          receiptHeader: 'Header Resit',
          receiptFooter: 'Footer Resit'
        },
        placeholders: {
          defaultPrinter: 'cth., EPSON TM-T82',
          pdfSaveLocation: 'Pilih folder',
          receiptHeader: 'Masukkan header resit',
          receiptFooter: 'Masukkan footer resit'
        },
        extras: {
          paperSize: 'Pilih saiz kertas yang betul untuk pencetak anda',
          saveReceiptsAsPdf: 'Aktifkan untuk simpan resit sebagai PDF selepas cetak',
          pdfSaveLocation: 'Folder untuk menyimpan resit PDF',
          autoOpenPdfAfterSave: 'Buka PDF secara automatik selepas disimpan'
        },
        actions: {
          browse: 'Semak Imbas',
          save: 'Simpan'
        },
        validations: {
          pdfSaveLocationRequired: 'Sila pilih lokasi simpanan PDF'
        },
        messages: {
          failedToSelectFolder: 'Gagal memilih folder'
        },
        paperSizeOptions: {
          thermal80mm: 'Thermal 80mm',
          a4Portrait: 'A4 Menegak',
          a5Landscape: 'A5 Melintang'
        }
      },
      backup: {
        tab: 'Sandaran',
        sections: {
          automaticBackup: 'Sandaran Automatik'
        },
        fields: {
          enableAutoBackup: 'Aktifkan sandaran automatik',
          backupFrequency: 'Kekerapan sandaran',
          retentionPeriodDays: 'Tempoh simpanan (hari)',
          backupDirectory: 'Direktori sandaran'
        },
        placeholders: {
          backupDirectory: 'Pilih folder'
        },
        extras: {
          retentionPeriodDays: 'Berapa lama fail sandaran disimpan',
          backupDirectory: 'Folder untuk menyimpan sandaran'
        },
        actions: {
          browse: 'Semak Imbas',
          save: 'Simpan',
          backupNow: 'Sandar Sekarang'
        },
        frequencyOptions: {
          hourly: 'Setiap Jam',
          daily: 'Harian',
          weekly: 'Mingguan',
          monthly: 'Bulanan'
        },
        messages: {
          failedToSelectFolder: 'Gagal memilih folder',
          backupNowComingSoon: 'Ciri sandar sekarang akan datang'
        }
      },
      systemInfo: {
        tab: 'Maklumat Sistem',
        cardTitle: 'Maklumat Sistem',
        fields: {
          applicationVersion: 'Versi Aplikasi',
          electronVersion: 'Versi Electron',
          nodeVersion: 'Versi Node',
          platform: 'Platform',
          databaseStatus: 'Status Pangkalan Data',
          databaseVersion: 'Versi Pangkalan Data',
          databaseName: 'Nama Pangkalan Data'
        },
        fallbacks: {
          appVersion: 'Tiada',
          electronVersion: 'Tiada',
          nodeVersion: 'Tiada',
          platform: 'Tiada',
          databaseStatus: 'Tiada',
          databaseVersion: 'Tiada',
          databaseName: 'Tiada'
        },
        actions: {
          refresh: 'Muat Semula',
          exportLogs: 'Eksport Log'
        },
        messages: {
          exportLogsComingSoon: 'Ciri eksport log akan datang'
        }
      }
    },
    home: {
      title: 'Utama',
      description: 'Panduan ringkas sebelum anda memulakan operasi.',
      currentSeason: {
        title: 'Musim Semasa',
        manageButton: 'Urus Musim',
        noActiveSeason: 'Tiada musim aktif',
        noActiveSeasonDesc: 'Sila aktifkan musim sebelum membuat transaksi.',
        goToSeasons: 'Pergi ke Musim',
        fields: {
          season: 'Musim',
          yearSeasonNum: 'Tahun / Musim #',
          period: 'Tempoh',
          openingPrice: 'Harga Pembukaan (per tan)',
          targetQuantity: 'Sasaran Kuantiti (kg)'
        },
        stats: {
          openingPrice: 'Harga Pembukaan',
          perTon: '/ tan',
          target: 'Sasaran',
          kg: 'kg'
        }
      },
      sections: {
        beforeYouStart: 'Sebelum anda bermula',
        menuIntroduction: 'Pengenalan menu'
      },
      cards: {
        showMore: 'Tunjuk Lebih',
        mainConfig: {
          title: 'Konfigurasi Utama',
          description: 'Pastikan sistem anda bersedia:',
          tags: {
            company: 'Syarikat',
            hardware: 'Perkakasan',
            printer: 'Pencetak',
            language: 'Bahasa'
          },
          hint: 'Mulakan di sini: Tetapan'
        },
        seasonPrices: {
          title: 'Musim & Harga',
          description: 'Transaksi memerlukan musim aktif dan harga produk.',
          goToSeasons: 'Pergi ke Musim',
          hint: 'Menu: Tetapan → Musim'
        },
        masterData: {
          title: 'Data Induk Bersedia',
          description: 'Sahkan senarai rujukan anda lengkap sebelum operasi.',
          tags: {
            farmers: 'Pesawah',
            manufacturers: 'Pengilang',
            products: 'Produk'
          }
        },
        purchases: {
          title: 'Belian',
          description: 'Timbang masuk, timbang keluar, bayaran dan sejarah pembelian.',
          hint: 'Menu: Transaksi → Belian'
        },
        sales: {
          title: 'Jualan',
          description: 'Jual kepada pengilang melalui timbang masuk bekas tare dan penyiapan timbang keluar.',
          hint: 'Menu: Transaksi → Jualan'
        },
        reports: {
          title: 'Laporan',
          description: 'Lihat ringkasan dan eksport laporan untuk belian, jualan dan pergerakan lori.',
          hint: 'Menu: Laporan'
        }
      }
    },
    menu: {
      home: 'Utama',
      dashboard: 'Papan Pemuka',
      farmers: 'Pesawah',
      manufacturers: 'Pengilang',
      reports: 'Laporan',
      purchaseReport: 'Laporan Belian',
      salesReport: 'Laporan Jualan',
      lorryReport: 'Laporan Lori',
      settings: 'Tetapan',
      general: 'Umum',
      seasonConfig: 'Musim',
      productConfig: 'Produk',
      backupRestore: 'Sandaran',
      purchases: 'Belian',
      weighIn: 'Timbang Masuk',
      history: 'Sejarah',
      payment: 'Bayaran',
      sales: 'Jualan',
      stockpiles: 'Stok Simpanan'
    }
  }
};

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, fallback) => fallback ?? key
});

const getByPath = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
};

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const loadLangFromSettings = useCallback(async () => {
    try {
      const result = await window.electronAPI.settings?.getAll();
      if (result?.success && result.data?.language) {
        setLang(result.data.language);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadLangFromSettings();

    const handler = () => {
      loadLangFromSettings();
    };

    window.addEventListener('language-changed', handler);
    return () => window.removeEventListener('language-changed', handler);
  }, [loadLangFromSettings]);

  const t = useCallback(
    (key, fallback) => {
      const dict = DICTS[lang] || DICTS.en;
      const enDict = DICTS.en;
      const val = getByPath(dict, key) ?? getByPath(enDict, key);
      return val ?? fallback ?? key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
