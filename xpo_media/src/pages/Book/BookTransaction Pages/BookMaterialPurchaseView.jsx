"use client"

import { useState, useEffect } from "react"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Card, Table, Modal, Spinner, Badge } from "react-bootstrap"

import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

// Confirmation Modal Component
const ConfirmationModal = ({ show, title, message, onConfirm, onCancel }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// Purchase Details Modal Component
const PurchaseDetailsModal = ({ show, purchase, onClose }) => {
  if (!purchase) return null

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton style={{ backgroundColor: "#0B3D7B", color: "white" }}>
        <Modal.Title>Purchase Details - {purchase.entryNo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-4">
          <Col md={6}>
            <p>
              <strong>Entry No:</strong> {purchase.entryNo}
            </p>
            <p>
              <strong>Entry Date:</strong> {purchase.entryDate?.toDate().toLocaleDateString()}
            </p>
            <p>
              <strong>Invoice No:</strong> {purchase.invoiceNo}
            </p>
          </Col>
          <Col md={6}>
            <p>
              <strong>Supplier:</strong> {purchase.supplierName} ({purchase.supplierCode})
            </p>
            <p>
              <strong>Address:</strong> {purchase.address}
            </p>
            <p>
              <strong>Gross Amount:</strong> ₹{purchase.grossAmount}
            </p>
          </Col>
        </Row>

        <h5 className="mb-3">Items</h5>
        <div className="table-responsive">
          <Table bordered hover>
            <thead style={{ backgroundColor: "#9C27B0", color: "white" }}>
              <tr>
                <th>S.N</th>
                <th>Description</th>
                <th>Head</th>
                <th>Std</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>GST %</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.description}</td>
                  <td>{item.head}</td>
                  <td>{item.std}</td>
                  <td>{item.unit}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.rate}</td>
                  <td>{item.gst}%</td>
                  <td>₹{item.total}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="8" className="text-end fw-bold">
                  Total:
                </td>
                <td className="fw-bold">₹{purchase.grossAmount}</td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => generatePDF(purchase)}
          style={{ backgroundColor: "#4CAF50", borderColor: "#4CAF50" }}
        >
          Export to PDF
        </Button>
        <Button
          variant="success"
          onClick={() => generateExcel(purchase)}
          style={{ backgroundColor: "#2196F3", borderColor: "#2196F3" }}
        >
          Export to Excel
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// Generate PDF function
const generatePDF = (purchase) => {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text("Book Material Purchase Details", 105, 15, { align: "center" })

  // Add purchase info
  doc.setFontSize(12)
  doc.text(`Entry No: ${purchase.entryNo}`, 14, 30)
  doc.text(`Entry Date: ${purchase.entryDate?.toDate().toLocaleDateString()}`, 14, 37)
  doc.text(`Invoice No: ${purchase.invoiceNo}`, 14, 44)
  doc.text(`Supplier: ${purchase.supplierName} (${purchase.supplierCode})`, 14, 51)
  doc.text(`Address: ${purchase.address}`, 14, 58)
  doc.text(`Gross Amount: ₹${purchase.grossAmount}`, 14, 65)

  // Add items table
  const tableColumn = ["S.N", "Description", "Head", "Std", "Unit", "Qty", "Rate", "GST %", "Total"]
  const tableRows = []

  purchase.items.forEach((item, index) => {
    const itemData = [
      index + 1,
      item.description,
      item.head,
      item.std,
      item.unit,
      item.qty,
      `₹${item.rate}`,
      `${item.gst}%`,
      `₹${item.total}`,
    ]
    tableRows.push(itemData)
  })

  // Add total row
  tableRows.push(["", "", "", "", "", "", "", "Total:", `₹${purchase.grossAmount}`])

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 75,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [156, 39, 176] },
  })

  // Save the PDF
  doc.save(`${purchase.entryNo}_purchase_details.pdf`)
  toast.success("PDF generated successfully!")
}

// Generate Excel function
const generateExcel = (purchase) => {
  // Prepare purchase info
  const purchaseInfo = [
    ["Entry No", purchase.entryNo],
    ["Entry Date", purchase.entryDate?.toDate().toLocaleDateString()],
    ["Invoice No", purchase.invoiceNo],
    ["Supplier", `${purchase.supplierName} (${purchase.supplierCode})`],
    ["Address", purchase.address],
    ["Gross Amount", `₹${purchase.grossAmount}`],
    [""], // Empty row
  ]

  // Prepare items table headers
  const tableHeaders = ["S.N", "Description", "Head", "Std", "Unit", "Qty", "Rate", "GST %", "Total"]

  // Prepare items data
  const itemsData = purchase.items.map((item, index) => [
    index + 1,
    item.description,
    item.head,
    item.std,
    item.unit,
    item.qty,
    `₹${item.rate}`,
    `${item.gst}%`,
    `₹${item.total}`,
  ])

  // Add total row
  itemsData.push(["", "", "", "", "", "", "", "Total:", `₹${purchase.grossAmount}`])

  // Combine all data
  const allData = [...purchaseInfo, tableHeaders, ...itemsData]

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(allData)

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Purchase Details")

  // Generate Excel file
  XLSX.writeFile(wb, `${purchase.entryNo}_purchase_details.xlsx`)
  toast.success("Excel file generated successfully!")
}

// Generate PDF for multiple purchases
const generateMultiplePurchasesPDF = (purchases) => {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text("Book Material Purchases Report", 105, 15, { align: "center" })

  // Add date range if available
  const today = new Date().toLocaleDateString()
  doc.setFontSize(10)
  doc.text(`Generated on: ${today}`, 195, 10, { align: "right" })

  // Define table columns
  const tableColumn = ["S.N", "Entry No", "Date", "Invoice No", "Supplier", "Items", "Amount"]
  const tableRows = []

  // Add data rows
  purchases.forEach((purchase, index) => {
    const itemData = [
      index + 1,
      purchase.entryNo,
      purchase.entryDate?.toDate().toLocaleDateString(),
      purchase.invoiceNo,
      purchase.supplierName,
      purchase.items.length,
      `₹${purchase.grossAmount}`,
    ]
    tableRows.push(itemData)
  })

  // Calculate total amount
  const totalAmount = purchases.reduce((sum, purchase) => sum + Number.parseFloat(purchase.grossAmount), 0).toFixed(2)

  // Add total row
  tableRows.push(["", "", "", "", "", "Total:", `₹${totalAmount}`])

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [156, 39, 176] },
  })

  // Save the PDF
  doc.save(`book_material_purchases_report.pdf`)
  toast.success("PDF report generated successfully!")
}

// Generate Excel for multiple purchases
const generateMultiplePurchasesExcel = (purchases) => {
  // Prepare headers
  const headers = ["S.N", "Entry No", "Date", "Invoice No", "Supplier", "Items", "Amount"]

  // Prepare data rows
  const rows = purchases.map((purchase, index) => [
    index + 1,
    purchase.entryNo,
    purchase.entryDate?.toDate().toLocaleDateString(),
    purchase.invoiceNo,
    purchase.supplierName,
    purchase.items.length,
    `₹${purchase.grossAmount}`,
  ])

  // Calculate total amount
  const totalAmount = purchases.reduce((sum, purchase) => sum + Number.parseFloat(purchase.grossAmount), 0).toFixed(2)

  // Add total row
  rows.push(["", "", "", "", "", "Total:", `₹${totalAmount}`])

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Purchases Report")

  // Generate Excel file
  XLSX.writeFile(wb, `book_material_purchases_report.xlsx`)
  toast.success("Excel report generated successfully!")
}

const BookMaterialPurchaseView = () => {
  const [storeId, setStoreId] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState(null)
  const [firstVisible, setFirstVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Selected purchase for details modal
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState(null)

  // Filter states
  const [filters, setFilters] = useState({
    entryNo: "",
    supplierName: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  })

  // Fetch store ID on component mount
  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        const storeRef = collection(db, "Schools", auth.currentUser.uid, "Store")
        const q = query(storeRef, limit(1))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          toast.error("Store not initialized. Please set up store first.")
          setLoading(false)
        } else {
          setStoreId(querySnapshot.docs[0].id)
        }
      } catch (error) {
        console.error("Error fetching Store ID:", error)
        toast.error("Failed to initialize. Please try again.")
        setLoading(false)
      }
    }

    fetchStoreId()
  }, [])

  // Fetch purchases when storeId is available
  useEffect(() => {
    if (storeId) {
      fetchPurchases()
    }
  }, [storeId])

  // Fetch purchases from Firestore
  const fetchPurchases = async (direction = "next") => {
    if (!storeId) return

    setLoading(true)
    try {
      const purchasesRef = collection(db, "Schools", auth.currentUser.uid, "Store", storeId, "BookMaterialPurchase")

      let q

      if (direction === "next") {
        if (lastVisible) {
          q = query(purchasesRef, orderBy("entryDate", "desc"), startAfter(lastVisible), limit(itemsPerPage))
        } else {
          q = query(purchasesRef, orderBy("entryDate", "desc"), limit(itemsPerPage))
        }
      } else if (direction === "prev") {
        q = query(purchasesRef, orderBy("entryDate", "desc"), endBefore(firstVisible), limitToLast(itemsPerPage))
      }

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        if (direction === "next") {
          setHasMore(false)
        } else {
          setHasPrevious(false)
        }
        setLoading(false)
        return
      }

      // Update pagination controls
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1])
      setFirstVisible(querySnapshot.docs[0])
      setHasMore(querySnapshot.docs.length === itemsPerPage)
      setHasPrevious(direction === "next" ? true : currentPage > 1)

      if (direction === "next") {
        setCurrentPage((prev) => prev + 1)
      } else if (direction === "prev") {
        setCurrentPage((prev) => prev - 1)
      }

      // Map documents to purchase objects
      const purchasesData = querySnapshot.docs
        .filter((doc) => doc.id !== "EntryNumberSequence") // Filter out the sequence document
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

      setPurchases(purchasesData)
      setFilteredPurchases(purchasesData)
    } catch (error) {
      console.error("Error fetching purchases:", error)
      toast.error("Failed to fetch purchases. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Apply filters
  const applyFilters = () => {
    let filtered = [...purchases]

    // Filter by entry number
    if (filters.entryNo) {
      filtered = filtered.filter((purchase) => purchase.entryNo.toLowerCase().includes(filters.entryNo.toLowerCase()))
    }

    // Filter by supplier name
    if (filters.supplierName) {
      filtered = filtered.filter((purchase) =>
        purchase.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase()),
      )
    }

    // Filter by date range
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999) // Set to end of day

      filtered = filtered.filter((purchase) => {
        const purchaseDate = purchase.entryDate?.toDate()
        return purchaseDate >= startDate && purchaseDate <= endDate
      })
    } else if (filters.startDate) {
      const startDate = new Date(filters.startDate)

      filtered = filtered.filter((purchase) => {
        const purchaseDate = purchase.entryDate?.toDate()
        return purchaseDate >= startDate
      })
    } else if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999) // Set to end of day

      filtered = filtered.filter((purchase) => {
        const purchaseDate = purchase.entryDate?.toDate()
        return purchaseDate <= endDate
      })
    }

    // Filter by amount range
    if (filters.minAmount) {
      filtered = filtered.filter(
        (purchase) => Number.parseFloat(purchase.grossAmount) >= Number.parseFloat(filters.minAmount),
      )
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(
        (purchase) => Number.parseFloat(purchase.grossAmount) <= Number.parseFloat(filters.maxAmount),
      )
    }

    setFilteredPurchases(filtered)
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      entryNo: "",
      supplierName: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    })
    setFilteredPurchases(purchases)
  }

  // View purchase details
  const viewPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase)
    setShowDetailsModal(true)
  }

  // Delete purchase confirmation
  const confirmDeletePurchase = (purchase) => {
    setPurchaseToDelete(purchase)
    setShowConfirmModal(true)
  }

  // Delete purchase
  const deletePurchase = async () => {
    if (!purchaseToDelete) return

    try {
      const purchaseRef = doc(
        db,
        "Schools",
        auth.currentUser.uid,
        "Store",
        storeId,
        "BookMaterialPurchase",
        purchaseToDelete.id,
      )

      await deleteDoc(purchaseRef)

      // Remove from state
      setPurchases((prev) => prev.filter((p) => p.id !== purchaseToDelete.id))
      setFilteredPurchases((prev) => prev.filter((p) => p.id !== purchaseToDelete.id))

      toast.success("Purchase entry deleted successfully!")
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast.error("Failed to delete purchase. Please try again.")
    } finally {
      setShowConfirmModal(false)
      setPurchaseToDelete(null)
    }
  }

  // Calculate total amount
  const totalAmount = filteredPurchases
    .reduce((sum, purchase) => sum + Number.parseFloat(purchase.grossAmount || 0), 0)
    .toFixed(2)

  return (
    <MainContentPage>
      <div className="container-fluid px-4 py-3">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h4 className="fw-bold">Book/Material Purchase View</h4>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <a href="/home" className="text-decoration-none">
              Home
            </a>
            <span className="separator mx-2"></span>
            <div>Transaction</div>
            <span className="separator mx-2"></span>
            <div>Book Transaction</div>
            <span className="separator mx-2"></span>
            <span>Book/Material Purchase View</span>
          </nav>
        </div>

        {/* Filters Card */}
        <Card className="shadow-sm mb-4">
          <Card.Header className="text-white py-3" style={{ backgroundColor: "#0B3D7B" }}>
            <h5 className="mb-0">Filter Options</h5>
          </Card.Header>
          <Card.Body style={{ backgroundColor: "#E3F2FD" }}>
            <Form>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Entry No</Form.Label>
                    <Form.Control
                      type="text"
                      name="entryNo"
                      value={filters.entryNo}
                      onChange={handleFilterChange}
                      placeholder="Search by entry no"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Supplier Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="supplierName"
                      value={filters.supplierName}
                      onChange={handleFilterChange}
                      placeholder="Search by supplier"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Min Amount</Form.Label>
                    <Form.Control
                      type="number"
                      name="minAmount"
                      value={filters.minAmount}
                      onChange={handleFilterChange}
                      placeholder="Minimum amount"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Amount</Form.Label>
                    <Form.Control
                      type="number"
                      name="maxAmount"
                      value={filters.maxAmount}
                      onChange={handleFilterChange}
                      placeholder="Maximum amount"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-end mb-3">
                  <Button
                    variant="primary"
                    onClick={applyFilters}
                    className="me-2"
                    style={{ backgroundColor: "#4CAF50", borderColor: "#4CAF50" }}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={resetFilters}
                    style={{ backgroundColor: "#F44336", borderColor: "#F44336" }}
                  >
                    Reset Filters
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Results Card */}
        <Card className="shadow-sm mb-4">
          <Card.Header
            className="text-white py-3 d-flex justify-content-between align-items-center"
            style={{ backgroundColor: "#0B3D7B" }}
          >
            <h5 className="mb-0">Purchase Records</h5>
            <div>
              <Button
                variant="success"
                className="me-2"
                onClick={() => generateMultiplePurchasesPDF(filteredPurchases)}
                disabled={filteredPurchases.length === 0}
                style={{ backgroundColor: "#4CAF50", borderColor: "#4CAF50" }}
              >
                Export to PDF
              </Button>
              <Button
                variant="info"
                onClick={() => generateMultiplePurchasesExcel(filteredPurchases)}
                disabled={filteredPurchases.length === 0}
                style={{ backgroundColor: "#2196F3", borderColor: "#2196F3" }}
                className="text-white"
              >
                Export to Excel
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading purchase records...</p>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-search fa-3x mb-3 text-muted"></i>
                <h5>No purchase records found</h5>
                <p className="text-muted">Try adjusting your filters or add new purchases</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table bordered hover>
                    <thead style={{ backgroundColor: "#9C27B0", color: "white" }}>
                      <tr>
                        <th>S.N</th>
                        <th>Entry No</th>
                        <th>Date</th>
                        <th>Invoice No</th>
                        <th>Supplier</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.map((purchase, index) => (
                        <tr key={purchase.id}>
                          <td>{index + 1}</td>
                          <td>{purchase.entryNo}</td>
                          <td>{purchase.entryDate?.toDate().toLocaleDateString()}</td>
                          <td>{purchase.invoiceNo}</td>
                          <td>
                            <div>{purchase.supplierName}</div>
                            <small className="text-muted">{purchase.supplierCode}</small>
                          </td>
                          <td>
                            <Badge bg="info">{purchase.items.length} items</Badge>
                          </td>
                          <td>₹{purchase.grossAmount}</td>
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              className="me-1 mb-1"
                              onClick={() => viewPurchaseDetails(purchase)}
                              style={{ backgroundColor: "#2196F3", borderColor: "#2196F3" }}
                            >
                              <i className="fas fa-eye"></i> View
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="mb-1"
                              onClick={() => confirmDeletePurchase(purchase)}
                              style={{ backgroundColor: "#F44336", borderColor: "#F44336" }}
                            >
                              <i className="fas fa-trash-alt"></i> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="6" className="text-end fw-bold">
                          Total Amount:
                        </td>
                        <td colSpan="2" className="fw-bold">
                          ₹{totalAmount}
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span className="text-muted">Showing {filteredPurchases.length} records</span>
                  </div>
                  <div>
                    <Button
                      variant="outline-primary"
                      onClick={() => fetchPurchases("prev")}
                      disabled={!hasPrevious}
                      className="me-2"
                    >
                      <i className="fas fa-chevron-left"></i> Previous
                    </Button>
                    <Button variant="outline-primary" onClick={() => fetchPurchases("next")} disabled={!hasMore}>
                      Next <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Purchase Details Modal */}
      <PurchaseDetailsModal
        show={showDetailsModal}
        purchase={selectedPurchase}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showConfirmModal}
        title="Confirm Delete"
        message={`Are you sure you want to delete purchase entry ${purchaseToDelete?.entryNo}? This action cannot be undone.`}
        onConfirm={deletePurchase}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Toastify Container */}
      <ToastContainer />

      <style jsx>{`
        .custom-breadcrumb {
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .custom-breadcrumb a {
          color: #007bff;
          text-decoration: none;
        }

        .custom-breadcrumb a:hover {
          text-decoration: underline;
        }

        .custom-breadcrumb .separator {
          color: #6c757d;
        }

        .custom-breadcrumb div {
          color: #6c757d;
        }

        .table-responsive {
          max-height: 600px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .form-control {
          background-color: #fff;
          border: 1px solid #ced4da;
        }

        .form-control:focus {
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        thead th {
          position: sticky;
          top: 0;
          z-index: 1;
        }
      `}</style>
    </MainContentPage>
  )
}

export default BookMaterialPurchaseView