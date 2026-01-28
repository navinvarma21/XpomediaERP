"use client"

import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Container, Spinner, Table, Card, Row, Col } from "react-bootstrap"

import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import "jspdf-autotable"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { FaPrint, FaFilePdf, FaUndo, FaSearch } from "react-icons/fa"

const DayCollectionReport = () => {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [administrationId, setAdministrationId] = useState(null)
  const [schoolInfo, setSchoolInfo] = useState({ name: "", address: "" })
  const [reportDate, setReportDate] = useState(new Date())
  const [collectionData, setCollectionData] = useState([])
  const [totalCollection, setTotalCollection] = useState(0)
  const componentRef = useRef(null)
  const snapshotListenerRef = useRef(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchSchoolInfo()
      const adminId = await fetchAdministrationId()
      if (adminId) {
        await fetchDayCollection(adminId)
      }
    }

    fetchInitialData()

    // Cleanup function to unsubscribe from snapshot listener
    return () => {
      if (snapshotListenerRef.current) {
        snapshotListenerRef.current()
      }
    }
  }, [])

  const fetchSchoolInfo = async () => {
    try {
      const schoolDoc = doc(db, "Schools", auth.currentUser.uid)
      const schoolSnapshot = await getDoc(schoolDoc)
      if (schoolSnapshot.exists()) {
        const data = schoolSnapshot.data()
        setSchoolInfo({
          name: data.SchoolName || "",
          address: data.SchoolAddres || "",
        })
      }
    } catch (error) {
      console.error("Error fetching school information:", error)
      toast.error("Failed to fetch school information")
    }
  }

  const fetchAdministrationId = async () => {
    try {
      const adminRef = collection(db, "Schools", auth.currentUser.uid, "Administration")
      const q = query(adminRef, limit(1))

      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            if (!querySnapshot.empty) {
              const adminId = querySnapshot.docs[0].id
              setAdministrationId(adminId)
              resolve(adminId)
            } else {
              toast.error("No administration found")
              resolve(null)
            }
          },
          (error) => {
            console.error("Error fetching Administration ID:", error)
            toast.error("Failed to initialize. Please try again.")
            resolve(null)
          },
        )
      })
    } catch (error) {
      console.error("Error setting up Administration ID listener:", error)
      toast.error("Failed to initialize. Please try again.")
      return null
    }
  }

  const processCollectionData = (rawData) => {
    const groupedData = rawData.reduce((acc, item) => {
      const admissionNumber = item.admissionNumber
      if (!acc[admissionNumber]) {
        acc[admissionNumber] = []
      }
      acc[admissionNumber].push(item)
      return acc
    }, {})

    const processedData = []
    let grandTotal = 0

    Object.entries(groupedData).forEach(([admissionNumber, items]) => {
      let studentTotal = 0
      let concessionTotal = 0

      items.forEach((item, index) => {
        const paidAmount = Number(item.amount) || 0
        const concessionAmount = Number(item.concession) || 0

        processedData.push({
          ...item,
          isFirstInGroup: index === 0,
          isLastInGroup: index === items.length - 1,
          rowSpan: items.length,
          paidAmount: paidAmount,
          concessionAmount: concessionAmount,
        })

        studentTotal += paidAmount
        concessionTotal += concessionAmount
      })

      // Add concession row if there's any concession
      if (concessionTotal > 0) {
        processedData.push({
          type: "concession",
          admissionNumber,
          amount: -concessionTotal,
          description: "Concession",
        })
      }

      // Calculate net total after applying concession
      const netTotal = studentTotal

      processedData.push({
        type: "subtotal",
        admissionNumber,
        amount: netTotal,
      })

      grandTotal += netTotal
    })

    return { processedData, grandTotal }
  }

  const fetchDayCollection = async (adminId = administrationId) => {
    if (!adminId) return

    setLoading(true)
    try {
      // Changed from BusFeeLog to BusBillEntries
      const billEntriesRef = collection(db, "Schools", auth.currentUser.uid, "Transactions", adminId, "BusBillEntries")

      const startDate = new Date(reportDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(reportDate)
      endDate.setHours(23, 59, 59, 999)

      // Query using timestamp field instead of billDate
      const q = query(billEntriesRef, where("timestamp", ">=", startDate), where("timestamp", "<=", endDate))

      // Unsubscribe from previous listener if exists
      if (snapshotListenerRef.current) {
        snapshotListenerRef.current()
      }

      // Set up real-time listener
      snapshotListenerRef.current = onSnapshot(
        q,
        (snapshot) => {
          const rawCollections = []

          snapshot.docs.forEach((doc) => {
            const data = doc.data()
            rawCollections.push({
              billNumber: data.billNumber,
              admissionNumber: data.admissionNumber,
              studentName: data.studentName,
              standard: data.course, // Changed from standard to course to match BusBillEntries schema
              section: data.section,
              description: data.feeDetails?.map((fee) => fee.feeHead).join(", ") || "",
              amount: Number.parseFloat(data.totalPaidAmount) || 0,
              concession: Number.parseFloat(data.totalConcessionAmount) || 0,
            })
          })

          const { processedData, grandTotal } = processCollectionData(rawCollections)
          setCollectionData(processedData)
          setTotalCollection(grandTotal)

          if (processedData.length === 0) {
            toast.info("No bus fee collection data found for the selected date")
          } else {
            toast.success(`Successfully loaded bus fee collection records`)
          }

          setLoading(false)
        },
        (error) => {
          console.error("Error fetching collection data:", error)
          toast.error("Failed to fetch collection data")
          setLoading(false)
        },
      )
    } catch (error) {
      console.error("Error setting up collection data listener:", error)
      toast.error("Failed to fetch collection data")
      setLoading(false)
    }
  }

  const handleDateChange = (date) => {
    setReportDate(date)
  }

  const handlePrint = () => {
    const doc = generatePDF()
    doc.autoPrint()
    window.open(doc.output("bloburl"), "_blank")
  }

  const generatePDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text(schoolInfo.name, 105, 20, { align: "center" })
    doc.setFontSize(12)
    doc.text(schoolInfo.address, 105, 30, { align: "center" })
    doc.setFontSize(14)
    doc.text("DAY BUS FEES COLLECTION REPORT", 105, 45, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Report As on: ${reportDate.toLocaleDateString()}`, 20, 55)
    doc.text(`Page 1 of 1`, 180, 55)

    const columns = [
      { header: "Bill No", dataKey: "billNumber" },
      { header: "Adm No", dataKey: "admissionNumber" },
      { header: "Name of the Student", dataKey: "studentName" },
      { header: "Std", dataKey: "standard" },
      { header: "Sec", dataKey: "section" },
      { header: "Description", dataKey: "description" },
      { header: "Amount", dataKey: "amount" },
    ]

    const tableData = []
    let currentAdmissionNumber = null
    let rowSpan = 0

    collectionData.forEach((item, index) => {
      if (item.type === "subtotal") {
        tableData.push({
          billNumber: "",
          admissionNumber: "",
          studentName: "",
          standard: "",
          section: "",
          description: "Subtotal",
          amount: { content: item.amount.toFixed(2), styles: { fontStyle: "bold", textColor: [0, 0, 0] } },
        })
        rowSpan = 0
      } else if (item.type === "concession") {
        tableData.push({
          billNumber: "",
          admissionNumber: "",
          studentName: "",
          standard: "",
          section: "",
          description: "Concession",
          amount: { content: item.amount.toFixed(2), styles: { textColor: [220, 53, 69] } },
        })
      } else {
        if (item.admissionNumber !== currentAdmissionNumber) {
          rowSpan = item.rowSpan
          currentAdmissionNumber = item.admissionNumber
        }

        const row = {
          billNumber: item.billNumber,
          admissionNumber: rowSpan > 0 ? { content: item.admissionNumber, rowSpan: rowSpan } : "",
          studentName: rowSpan > 0 ? { content: item.studentName, rowSpan: rowSpan } : "",
          standard: rowSpan > 0 ? { content: item.standard, rowSpan: rowSpan } : "",
          section: rowSpan > 0 ? { content: item.section, rowSpan: rowSpan } : "",
          description: item.description,
          amount: item.paidAmount.toFixed(2),
        }
        tableData.push(row)

        rowSpan--
      }
    })

    doc.autoTable({
      columns: columns,
      body: tableData,
      startY: 65,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        admissionNumber: { halign: "center", valign: "middle" },
        studentName: { halign: "center", valign: "middle" },
        standard: { halign: "center", valign: "middle" },
        section: { halign: "center", valign: "middle" },
        amount: { halign: "right" },
      },
      headStyles: { fillColor: [11, 61, 123], textColor: [255, 255, 255] },
      didParseCell: (data) => {
        if (
          data.section === "body" &&
          data.column.dataKey === "amount" &&
          data.cell.raw &&
          typeof data.cell.raw === "object"
        ) {
          data.cell.styles.fontStyle = data.cell.raw.styles.fontStyle || "normal"
          data.cell.styles.textColor = data.cell.raw.styles.textColor || [0, 0, 0]
          data.cell.text = data.cell.raw.content
        }
      },
    })

    const finalY = doc.lastAutoTable.finalY || 65
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.text(`Total Fee: ${totalCollection.toFixed(2)}`, 170, finalY + 10, { align: "right" })

    return doc
  }

  const downloadPDF = () => {
    const doc = generatePDF()
    doc.save("day_bus_collection_report.pdf")
  }

  const handleReset = () => {
    setReportDate(new Date())
    setCollectionData([])
    setTotalCollection(0)

    // Unsubscribe from current listener
    if (snapshotListenerRef.current) {
      snapshotListenerRef.current()
      snapshotListenerRef.current = null
    }
  }

  const renderTableBody = () => {
    if (collectionData.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center">
            No bus fee collection data available for the selected date.
          </td>
        </tr>
      )
    }

    return collectionData.map((item, index) => {
      if (item.type === "subtotal") {
        return (
          <tr key={`subtotal-${item.admissionNumber}`} className="subtotal-row">
            <td colSpan="6"></td>
            <td className="text-end fw-bold dotted-underline">{item.amount.toFixed(2)}</td>
          </tr>
        )
      }

      if (item.type === "concession") {
        return (
          <tr key={`concession-${item.admissionNumber}`} className="concession-row">
            <td colSpan="6" className="text-end">
              Concession
            </td>
            <td className="text-end text-danger">{item.amount.toFixed(2)}</td>
          </tr>
        )
      }

      return (
        <tr key={index}>
          <td>{item.billNumber}</td>
          {item.isFirstInGroup ? (
            <>
              <td rowSpan={item.rowSpan} className="align-middle text-center">
                {item.admissionNumber}
              </td>
              <td rowSpan={item.rowSpan} className="align-middle text-center">
                {item.studentName}
              </td>
              <td rowSpan={item.rowSpan} className="align-middle text-center">
                {item.standard}
              </td>
              <td rowSpan={item.rowSpan} className="align-middle text-center">
                {item.section}
              </td>
            </>
          ) : null}
          <td>{item.description}</td>
          <td className="text-end">{item.paidAmount.toFixed(2)}</td>
        </tr>
      )
    })
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className=" d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div>Bus Fee Collection Report</div>
            <span className="separator mx-2">&gt;</span>
            <span>Day Collection Report</span>
          </nav>
        </div>

        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white py-3">
            <h2 className="mb-0">Day Bus Fee Collection Report</h2>
          </Card.Header>
          <Card.Body className="p-4">
            <Form className="mb-4">
              <Row className="align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Select Your Report Date</Form.Label>
                    <DatePicker
                      selected={reportDate}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button className="custom-btn-clr w-100" onClick={() => fetchDayCollection()} disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FaSearch className="me-2" /> Fetch Report
                      </>
                    )}
                  </Button>
                </Col>
                <Col md={6}>
                  <div className="d-flex justify-content-end">
                    <Button className="btn custom-btn-clr me-2" onClick={handlePrint} disabled={processing}>
                      <FaPrint className="me-2" /> Print
                    </Button>
                    <Button className="btn custom-btn-clr me-2" onClick={downloadPDF} disabled={processing}>
                      <FaFilePdf className="me-2" /> Download PDF
                    </Button>
                    <Button className="btn btn-secondary" onClick={handleReset}>
                      <FaUndo className="me-2" /> Reset
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>

            <div ref={componentRef} className="report-preview">
              <div className="text-center mb-4">
                <h3 className="school-name">{schoolInfo.name}</h3>
                <p className="school-address">{schoolInfo.address}</p>
                <h4 className="report-title">DAY BUS FEES COLLECTION REPORT</h4>
                <div className="d-flex justify-content-between mt-3">
                  <p>Report As on: {reportDate.toLocaleDateString()}</p>
                  <p>Page 1 of 1</p>
                </div>
              </div>

              <div className="table-responsive">
                <Table bordered hover className="report-table">
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Adm No</th>
                      <th>Name of the Student</th>
                      <th>Std</th>
                      <th>Sec</th>
                      <th>Description</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>{renderTableBody()}</tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan="6" className="text-end fw-bold">
                        Total Fee
                      </td>
                      <td className="text-end fw-bold double-underline">{totalCollection.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />

      <style jsx>{`
        .bg-primary {
          background-color: #0B3D7B !important;
        }
        .text-primary {
          color: #0B3D7B !important;
        }
        .custom-btn-clr {
          background-color: #0B3D7B;
          border-color: #0B3D7B;
          color: white;
        }
        .custom-btn-clr:hover {
          background-color: #092c5a;
          border-color: #092c5a;
        }
        
        .report-preview {
          border: 1px solid #dee2e6;
          padding: 20px;
          margin-bottom: 20px;
          background-color: white;
        }

        .school-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .school-address {
          font-size: 16px;
          margin-bottom: 16px;
        }

        .report-title {
          font-size: 20px;
          font-weight: bold;
          margin: 16px 0;
          text-decoration: underline;
        }

        .report-table {
          font-size: 14px;
          width: 100%;
          border-collapse: collapse;
        }

        .report-table th, .report-table td {
          border: 1px solid #dee2e6;
          padding: 8px;
          text-align: left;
        }

        .report-table th {
          background-color: #0B3D7B;
          color: white;
          vertical-align: middle;
        }
        
        .report-table td {
          vertical-align: middle;
        }
        
        .concession-row td {
          background-color: #f8f9fa;
        }
        
        .subtotal-row td {
          border-top: 1px dashed #dee2e6;
        }
        
        .total-row td {
          border-top: 2px solid #000;
        }

        .dotted-underline {
          border-bottom: 1px dotted #000;
          padding-bottom: 4px;
        }

        .double-underline {
          border-bottom: 3px double #000;
          padding-bottom: 4px;
        }

        .text-danger {
          color: #dc3545;
        }

        /* Group spacing */
        tr + tr:not(.subtotal-row) td:empty {
          border-top: none;
        }

        .subtotal-row td {
          border-top: none;
        }

        @media (max-width: 768px) {
          .btn {
            width: 100%;
            margin-bottom: 10px;
          }
        }
      `}</style>
    </MainContentPage>
  )
}

export default DayCollectionReport

